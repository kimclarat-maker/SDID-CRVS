import { Accordion as LibAccordion } from "rsuite";

type AccordionProps = {
  list: {
    id: number;
    title: string;
    description: string;
  }[];
};

const Accordion: React.FC<AccordionProps> = ({ list }) => {
  return (
    <LibAccordion defaultActiveKey={0} bordered>
      {list.map((el, i) => {
        return (
          <LibAccordion.Panel header={el.title} eventKey={i}>
            {el.description}
          </LibAccordion.Panel>
        );
      })}
    </LibAccordion>
  );

  // return (
  //   <div className="accordion" id="accordionExample">
  //     {list.map((item, i) => {
  //       return (
  //         <div className="accordion-item" key={i}>
  //           <h2
  //             className="fontSize18 accordion-header"
  //             id={`heading${item.id}`}
  //           >
  //             <button
  //               className="accordion-button"
  //               type="button"
  //               data-bs-toggle="collapse"
  //               data-bs-target={`#collapse${item.id}`}
  //               aria-expanded="true"
  //               aria-controls={`collapse${item.id}`}
  //             >
  //               <span className="fontSize18">{item.title}</span>
  //             </button>
  //           </h2>
  //           <div
  //             id={`collapse${item.id}`}
  //             className="accordion-collapse collapse"
  //             aria-labelledby={`heading${item.id}`}
  //             data-bs-parent="#accordionExample"
  //           >
  //             <div className="accordion-body">{item.description}</div>
  //           </div>
  //         </div>
  //       );
  //     })}
  //   </div>
  // );
};

export default Accordion;
