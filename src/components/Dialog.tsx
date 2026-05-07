import {
  Element as SolidElement,
  ParentComponent,
  createSignal,
} from "solid-js";

import styles from "./Dialog.module.css";
export const Dialog: ParentComponent<{
  id: string;
  onClose?: () => void;

  contentClass?: string;
  additionalFooter?: SolidElement;
}> = (props) => {
  let contentRef!: HTMLDivElement;
  const [atTop, setAtTop] = createSignal(true);
  const [atBottom, setAtBottom] = createSignal(true);

  const onScroll = (evt: Event) => {
    const target = evt.target as HTMLDivElement;
    setAtBottom(
      target.scrollHeight - 12 <= target.scrollTop + target.clientHeight,
    );
    setAtTop(target.scrollTop === 0);
  };

  return (
    <dialog id={props.id} class={styles.dialog} onClose={props.onClose}>
      <div class={styles.body}>
        <div
          ref={contentRef}
          onFocusIn={onScroll}
          on:scroll={onScroll}
          class={[
            styles.content,
            !atBottom() && styles.bottomGlow,
            !atTop() && styles.topGlow,
            props.contentClass,
          ]}
        >
          {props.children}
        </div>
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
