import React from "react";
import style from "./form.module.scss";

const Form = ({
  children,
  handleSubmit,
}: {
  children?: JSX.Element | JSX.Element[];
  handleSubmit?: any;
}) => {
  return (
    <form
      onSubmit={(e) => {
        handleSubmit(e);
      }}
      className={style.form_container}
    >
      {children}
    </form>
  );
};

const FormInput = ({
  placeholder,
  name,
  useRef,
  required,
  handleChange,
  valueType,
}: {
  placeholder?: string;
  name?: string;
  required?: boolean;
  useRef?: React.MutableRefObject<any>;
  valueType?: string;
  handleChange?: any;
}) => {
  return (
    <div className={style.form_input_container}>
      {name && (
        <label
          className={`${style.form_input_lable} ${required && style.required}`}
          htmlFor={name}
        >
          {name}
        </label>
      )}
      <input
        onChange={(e: React.FormEvent<HTMLInputElement>) => {
          handleChange && handleChange(e);
        }}
        type={valueType}
        ref={useRef}
        className={style.form_input}
        placeholder={placeholder}
        name={name}
        required={required}
      />
    </div>
  );
};

const FormRow = ({ children }: { children?: JSX.Element[] | JSX.Element }) => {
  return <div className={style.form_row}>{children}</div>;
};
const FormColumn = ({
  children,
}: {
  children?: JSX.Element[] | JSX.Element;
}) => {
  return <div className={style.form_column}>{children}</div>;
};

const FormSelect = ({ children }: { children: JSX.Element }) => {
  return <div>{children}</div>;
};
const FormSubmit = ({ placeholder }: { placeholder?: string }) => {
  return (
    <input className={style.form_submit} type="submit" value={placeholder} />
  );
};

export default Form;
export { FormInput, FormSelect, FormSubmit, FormRow, FormColumn };
