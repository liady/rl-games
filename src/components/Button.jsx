import React from "react";
import cx from "classnames";
import styles from "./Button.module.scss";

export default function Button({ text, onClick, disabled, selected }) {
  const inactive = disabled || selected;
  return (
    <button
      className={cx(styles.button, { [styles.disabled]: inactive })}
      onClick={inactive ? null : onClick}
    >
      {text}
    </button>
  );
}
