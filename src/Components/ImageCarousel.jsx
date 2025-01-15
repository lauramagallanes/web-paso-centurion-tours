import { useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
//import ExampleCarouselImage from 'components/ExampleCarouselImage';
import { images } from '../utils/images';

function ImageCarousel() {
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  return (
    <Carousel activeIndex={index} onSelect={handleSelect}>
      <Carousel.Item>
        {/* <ExampleCarouselImage text="First slide" /> */}
        <img src={images.mosquetaCoronaOliva} alt="batara pintado" style={{ width: '100%', maxHeight: "400px", objectFit: 'cover' }} className='carousel'/>
        <Carousel.Caption>
          <h3>Observación de aves</h3>
          <p className='carousel'>Uno de los mejores lugares para observar aves en Uruguay</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        {/* <ExampleCarouselImage text="Second slide" /> */}
        <img src={images.grupoPersonas2} alt="" style={{ width: '100%', maxHeight: "400px", objectFit: 'cover' }} className='carousel' />
        <Carousel.Caption>
          <h3>Senderos guiados</h3>
          <p className='carousel'>Tenemos 7 senderos disponibles para conocer</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        {/* <ExampleCarouselImage text="Third slide" /> */}
        <img src={images.paisajePalmeras} alt="" style={{ width: '100%', maxHeight: "400px", objectFit: 'cover' }} className='carousel'/>
        <Carousel.Caption>
          <h3>Alojamiento</h3>
          <p className='carousel'>
            Habitación con baño privado y capacidad para 4 personas
          </p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}

export default ImageCarousel;