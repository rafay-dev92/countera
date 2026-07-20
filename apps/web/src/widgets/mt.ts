/**
 * Thin re-exports of the Material Tailwind components whose 2.1.4 typings
 * declare DOM props (crossOrigin, handler, onPointerEnterCapture, ...) as
 * required under @types/react 18. Casting to a loose functional-component
 * type here removes that third-party noise at a single point instead of at
 * every call site; runtime behavior is unchanged.
 */
import type { FC } from "react";
import {
  Input as MTInput,
  Dialog as MTDialog,
  Checkbox as MTCheckbox,
  Radio as MTRadio,
  Textarea as MTTextarea,
  Select as MTSelect,
  Option as MTOption,
} from "@material-tailwind/react";

export const Input = MTInput as unknown as FC<any>;
export const Dialog = MTDialog as unknown as FC<any>;
export const Checkbox = MTCheckbox as unknown as FC<any>;
export const Radio = MTRadio as unknown as FC<any>;
export const Textarea = MTTextarea as unknown as FC<any>;
export const Select = MTSelect as unknown as FC<any>;
export const Option = MTOption as unknown as FC<any>;
