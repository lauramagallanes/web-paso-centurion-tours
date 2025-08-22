# Networking Module Outputs
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "vpc_cidr_block" {
  value       = aws_vpc.main.cidr_block
  description = "VPC CIDR block"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "private_subnet_cidrs" {
  value       = aws_subnet.private[*].cidr_block
  description = "Private subnet CIDR blocks"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.this.id
  description = "Internet Gateway ID"
}

output "nat_instance_id" {
  value       = aws_instance.nat_instance.id
  description = "NAT Instance ID"
}

output "nat_instance_public_ip" {
  value       = aws_eip.nat_instance.public_ip
  description = "NAT Instance Elastic IP for troubleshooting"
}

output "nat_instance_security_group_id" {
  value       = aws_security_group.nat_instance.id
  description = "NAT Instance security group ID"
}

output "s3_vpc_endpoint_id" {
  value       = aws_vpc_endpoint.s3.id
  description = "S3 VPC Endpoint ID"
}

output "private_route_table_ids" {
  value       = aws_route_table.private[*].id
  description = "Private route table IDs"
}

