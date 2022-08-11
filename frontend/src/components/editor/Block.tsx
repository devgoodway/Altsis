import React, { useEffect } from "react";

import DividerBlock from "./blocks/DividerBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import InputBlock from "./blocks/InputBlock";
import Paragraphblock from "./blocks/ParagraphBlock";
import TableBlock from "./blocks/TableBlock";
import { useEditorData } from "./context/editorContext";
import { IBlock, IHeadingBlock, IInputBlock, IParagraphBlock } from "./type";
import style from "./editor.module.scss";

const Block = ({ data, editorId }: { data: IBlock; editorId: string }) => {
  const { editorData } = useEditorData();

  const Wrapper = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    return (
      <div id={`${editorId}-${data.id}`} className={style.block}>
        {children}
      </div>
    );
  };
  useEffect(() => {
    console.log(data);
    return () => {};
  }, []);

  switch (data.type) {
    case "heading":
      return (
        <Wrapper>
          <HeadingBlock block={data as IHeadingBlock} />
        </Wrapper>
      );

    case "paragraph":
      return (
        <Wrapper>
          <Paragraphblock block={data as IParagraphBlock} />
        </Wrapper>
      );
    case "divider":
      return (
        <Wrapper>
          <DividerBlock />
        </Wrapper>
      );
    case "table":
      return (
        <Wrapper>
          <TableBlock />
        </Wrapper>
      );
    case "input":
      return (
        <Wrapper>
          <InputBlock block={data as IInputBlock} />
        </Wrapper>
      );

    default:
      break;
  }
  return (
    <Wrapper>
      <div></div>
    </Wrapper>
  );
};

export default Block;
