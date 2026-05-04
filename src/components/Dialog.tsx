import { Element as SolidElement, ParentComponent } from "solid-js";
import styles from "./Dialog.module.css";

export const Dialog: ParentComponent<{
  id: string;
  onClose?: () => void;

  contentClass?: string;
  additionalFooter?: SolidElement;
}> = (props) => {
  return (
    <dialog id={props.id} class={styles.dialog} onClose={props.onClose}>
      <div class={styles.body}>
        <div class={[styles.content, props.contentClass]}>{props.children}</div>
        <footer class={styles.footer}>
          <button class={styles.button} commandfor={props.id} command="close">
            Close
          </button>
          {props.additionalFooter}
        </footer>
      </div>
    </dialog>
  );
};
