import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useField } from "react-final-form";
import { describe, expect, it, vi } from "vitest";
import type { Field } from "./schema.js";
import type { Registry } from "./registryTypes.js";
import {
  FieldRenderer,
  FormBuilder,
  type FormBuilderValuesChangeMeta,
  buildSparseMergePatchFromFinalForm,
} from "./formBuilder.js";

const testLabels = { submitButton: "Save", resetButton: "Discard Changes" };

function TestTextInput(props: { name: string }) {
  const { input } = useField<string>(props.name, {
    subscription: { value: true },
  });
  const value = typeof input.value === "string" ? input.value : "";

  return (
    <input
      aria-label={props.name}
      value={value}
      onChange={(event) => input.onChange(event.currentTarget.value)}
    />
  );
}

describe("buildSparseMergePatchFromFinalForm", () => {
  it("includes only modified paths and preserves nulls", () => {
    const patch = buildSparseMergePatchFromFinalForm({
      values: {
        profile: { name: "Ada", email: null },
        role: "owner",
      },
      modified: {
        "profile.name": true,
        "profile.email": true,
        role: false,
      },
    });

    expect(patch).toEqual({
      profile: { name: "Ada", email: null },
    });
  });

  it("supports array index paths", () => {
    const patch = buildSparseMergePatchFromFinalForm({
      values: { scopes: ["read", "write"] },
      modified: { "scopes.1": true },
    });

    expect(Array.isArray(patch.scopes)).toBe(true);
    expect((patch.scopes as string[])[1]).toBe("write");
  });
});

describe("FieldRenderer", () => {
  it("renders a registry component when type is supported", () => {
    const field: Field = {
      type: "textInput",
      path: "name",
      label: "Name",
    };
    const registry: Registry = {
      textInput: ({ name }) => <div data-testid="field" data-name={name} />,
    };

    render(
      <FieldRenderer
        field={field}
        registry={registry}
        name="name"
        context={{}}
      />,
    );

    expect(screen.getByTestId("field")).toHaveAttribute("data-name", "name");
  });

  it("throws when registry has no matching component", () => {
    const field: Field = {
      type: "textInput",
      path: "name",
      label: "Name",
    };

    expect(() =>
      render(
        <FieldRenderer field={field} registry={{}} name="name" context={{}} />,
      ),
    ).toThrow("Unsupported field type: textInput");
  });
});

describe("FormBuilder", () => {
  it("uses field name override when provided", () => {
    const schema: Field[] = [
      {
        type: "textInput",
        path: "profile.email",
        name: "email",
        label: "Email",
      },
    ];

    const registry: Registry = {
      textInput: ({ name, field }) => (
        <div data-testid="field" data-name={name} data-path={field.path} />
      ),
    };

    render(
      <FormBuilder
        schema={schema}
        data={{ profile: { email: "a@example.com" } }}
        registry={registry}
        context={{}}
        labels={testLabels}
        onSubmit={() => undefined}
      />,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveAttribute("data-name", "email");
    expect(field).toHaveAttribute("data-path", "profile.email");
  });

  it("does not emit onValuesChange on initial render", () => {
    const onValuesChange = vi.fn();
    const schema: Field[] = [
      {
        type: "textInput",
        path: "name",
        label: "Name",
      },
    ];
    const registry: Registry = {
      textInput: ({ name }) => <TestTextInput name={name} />,
    };

    render(
      <FormBuilder
        schema={schema}
        data={{ name: "" }}
        registry={registry}
        context={{}}
        onValuesChange={onValuesChange}
        labels={testLabels}
        onSubmit={() => undefined}
      />,
    );

    expect(onValuesChange).not.toHaveBeenCalled();
  });

  it("emits values and meta when values change", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    const schema: Field[] = [
      {
        type: "textInput",
        path: "name",
        label: "Name",
      },
    ];
    const registry: Registry = {
      textInput: ({ name }) => <TestTextInput name={name} />,
    };

    render(
      <FormBuilder
        schema={schema}
        data={{ name: "" }}
        registry={registry}
        context={{}}
        onValuesChange={onValuesChange}
        labels={testLabels}
        onSubmit={() => undefined}
      />,
    );

    await user.type(screen.getByLabelText("name"), "A");

    await waitFor(() => expect(onValuesChange).toHaveBeenCalledTimes(1));

    const [values, meta] = onValuesChange.mock.calls[0] as [
      Record<string, unknown>,
      FormBuilderValuesChangeMeta,
    ];
    const firstPatch = meta.getSparseChanges();
    const secondPatch = meta.getSparseChanges();

    expect(values).toEqual({ name: "A" });
    expect(meta.dirty).toBe(true);
    expect(meta.pristine).toBe(false);
    expect(meta.submitting).toBe(false);
    expect(meta.valid).toBe(true);
    expect(meta.modified.name).toBe(true);
    expect(firstPatch).toEqual({ name: "A" });
    expect(secondPatch).toEqual({ name: "A" });
    expect(firstPatch).toBe(secondPatch);
  });

  it("does not emit onValuesChange when only submission state changes", async () => {
    const user = userEvent.setup();
    let resolveSubmit!: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = () => resolve();
    });
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn(async () => {
      await submitPromise;
    });
    const schema: Field[] = [
      {
        type: "textInput",
        path: "name",
        label: "Name",
      },
    ];
    const registry: Registry = {
      textInput: ({ name }) => <TestTextInput name={name} />,
    };

    render(
      <FormBuilder
        schema={schema}
        data={{ name: "" }}
        registry={registry}
        context={{}}
        onValuesChange={onValuesChange}
        labels={testLabels}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("name"), "A");
    await waitFor(() => expect(onValuesChange).toHaveBeenCalledTimes(1));
    onValuesChange.mockClear();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onValuesChange).not.toHaveBeenCalled();

    resolveSubmit();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled(),
    );
  });

  it("hides default action buttons when showDefaultActions is false", () => {
    const schema: Field[] = [
      {
        type: "textInput",
        path: "name",
        label: "Name",
      },
    ];
    const registry: Registry = {
      textInput: ({ name }) => <TestTextInput name={name} />,
    };

    render(
      <FormBuilder
        schema={schema}
        data={{ name: "" }}
        registry={registry}
        context={{}}
        showDefaultActions={false}
        labels={testLabels}
        onSubmit={() => undefined}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Discard Changes" }),
    ).not.toBeInTheDocument();
  });
});
