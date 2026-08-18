import { Heading, Stack, Text } from "rsuite";
import "./styles.css";
import React, { ReactNode } from "react";
import { Tag, TagGroup } from "rsuite";

type TagType = {
  name: string;
  value: string | number;
}[];

function Separator({ text, className }: { text?: string; className?: string }) {
  return (
    <div className="seprator-container">
      {text && <Text className={`${className}`}>{text}</Text>}
    </div>
  );
}

export default Separator;
