/**
 * Owns the public exports for the react-form-builder package. This file is the
 * only supported package API boundary and does not add behavior beyond stable
 * root exports.
 */

export {
  FieldRenderer,
  FormBuilder,
  buildSparseMergePatchFromFinalForm,
} from "./formBuilder.js";
export type {
  FinalFormModified,
  FormBuilderProps,
  FormBuilderValuesChangeMeta,
  MergePatch,
} from "./formBuilder.js";
export { registry } from "./registry.js";
export type {
  FieldComponent,
  FieldComponentProps,
  FormContext,
  FormFieldLabels,
  Registry,
} from "./registryTypes.js";
export type * from "./schema.js";
export type * from "./sharedSchema.js";
export type * from "./viewerSchema.js";
export { getIn, joinName, setIn } from "./dotPath.js";
export type { DotPath } from "./dotPath.js";
export { SectionShell } from "./fields/sectionShell.js";
