import Carousel from "react-grid-carousel";

export default ({ data }: { data: any }) => {
  return (
    <Carousel
      cols={1}
      rows={1}
      gap={20}
      showDots
      hideArrow
      loop
      scrollSnap
      autoplay={8000}
      spaceBetween={32}
      grabCursor
      centererSlides
      dotColorActive="var(--rs-primary-color)"
    >
      {data.map((item: any, index: number) => {
        return <Carousel.Item key={index}>{item}</Carousel.Item>;
      })}
    </Carousel>
  );
};
