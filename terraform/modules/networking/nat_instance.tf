# NAT Instance Configuration

# AMI for Amazon Linux 2 ARM64
data "aws_ami" "amazon_linux2_arm" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-arm64-gp2"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

# Elastic IP for NAT Instance
resource "aws_eip" "nat_instance" {
  domain = "vpc"

  tags = {
    Name = "tinambu-nat-eip-${var.environment}"
  }
}

# IAM Role for NAT Instance (SSM Session Manager)
resource "aws_iam_role" "nat_instance" {
  name = "tinambu-nat-instance-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "nat_instance_ssm" {
  role       = aws_iam_role.nat_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "nat_instance" {
  name = "tinambu-nat-instance-profile-${var.environment}"
  role = aws_iam_role.nat_instance.name
}

# Security Group for NAT Instance
resource "aws_security_group" "nat_instance" {
  name        = "tinambu-nat-instance-sg-${var.environment}"
  description = "NAT Instance security group - hardened"
  vpc_id      = aws_vpc.main.id

  # Outbound HTTPS only
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound from private subnets (all TCP ports for forwarding)
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.private : subnet.cidr_block]
  }

  tags = {
    Name = "tinambu-nat-instance-sg-${var.environment}"
  }
}

# NAT Instance
resource "aws_instance" "nat_instance" {
  ami                         = data.aws_ami.amazon_linux2_arm.id
  instance_type               = "t4g.nano"
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.nat_instance.id]
  associate_public_ip_address = true
  source_dest_check           = false
  iam_instance_profile        = aws_iam_instance_profile.nat_instance.name
  key_name                    = null

  # User data for NAT configuration (Amazon Linux 2)
  user_data = <<-EOF
    #!/bin/bash
    yum -y update
    sysctl -w net.ipv4.ip_forward=1
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    yum -y install iptables-services
    systemctl enable iptables
    systemctl start iptables
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -s 10.0.0.0/16 -j ACCEPT
    service iptables save
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF

  tags = {
    Name = "tinambu-nat-instance-${var.environment}"
  }
}

# Associate EIP with NAT Instance
resource "aws_eip_association" "nat_instance" {
  instance_id   = aws_instance.nat_instance.id
  allocation_id = aws_eip.nat_instance.id
}

# Auto-recovery CloudWatch Alarm (no extra cost)
resource "aws_cloudwatch_metric_alarm" "nat_instance_recovery" {
  alarm_name          = "tinambu-nat-instance-recovery-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed_System"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "0"
  alarm_description   = "Trigger auto-recovery for NAT Instance system check failure"
  alarm_actions       = ["arn:aws:automate:${var.region}:ec2:recover"]

  dimensions = {
    InstanceId = aws_instance.nat_instance.id
  }

  tags = {
    Name = "tinambu-nat-instance-recovery-${var.environment}"
  }
}

# Route from private subnets to NAT Instance
resource "aws_route" "private_nat" {
  count                  = length(aws_route_table.private)
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.nat_instance.primary_network_interface_id
}

