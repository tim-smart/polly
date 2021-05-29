import { ButtonStyle, Component, ComponentType } from "droff/dist/types";

export const grid = (items: Component[][]): Component[] =>
  items.map(
    (components): Component => ({
      type: ComponentType.ACTION_ROW,
      components,
    })
  );

export const button = (
  button: Omit<Component, "type" | "components">
): Component => ({
  type: ComponentType.BUTTON,
  style: ButtonStyle.PRIMARY,
  ...button,
});
