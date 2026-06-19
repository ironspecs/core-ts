import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import arrayMutators from "final-form-arrays";
import type { ReactNode } from "react";
import { Form } from "react-final-form";
import { describe, expect, it } from "vitest";
import type { Registry } from "../registryTypes.js";
import { DiscriminatingForm } from "./discriminatingForm.js";
import { FormArray } from "./formArray.js";
import { Section } from "./section.js";
import { SectionShell } from "./sectionShell.js";
import { TabsFieldComp } from "./tabs.js";

const registry: Registry = {};

function getRootElement(container: HTMLElement) {
  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  return root as HTMLElement;
}

function getFormRootElement(container: HTMLElement) {
  const form = container.querySelector("form");
  expect(form).not.toBeNull();
  return getRootElement(form as HTMLElement);
}

function renderInForm(
  children: ReactNode,
  initialValues: Record<string, unknown>,
) {
  return render(
    <Form
      initialValues={initialValues}
      mutators={{ ...arrayMutators }}
      onSubmit={() => undefined}
    >
      {() => <form>{children}</form>}
    </Form>,
  );
}

function expectStaticShell(root: HTMLElement) {
  expect(root.tagName).toBe("DIV");
  expect(root).not.toHaveClass("collapse");
  expect(root).not.toHaveClass("card");
}

describe("SectionShell", () => {
  it("renders a collapsible details element with a summary", () => {
    const { container } = render(
      <SectionShell label="Profile" collapsible defaultOpen>
        <div>Body</div>
      </SectionShell>,
    );

    const root = getRootElement(container);

    expect(root.tagName).toBe("DETAILS");
    expect(root).toHaveAttribute("open");
    expect(root.querySelector("summary")).not.toBeNull();
  });

  it("renders a static div without collapse behavior", () => {
    const { container, getByText } = render(
      <SectionShell label="Profile">
        <div>Body</div>
      </SectionShell>,
    );

    const root = getRootElement(container);

    expectStaticShell(root);
    expect(getByText("Profile")).toBeInTheDocument();
    expect(getByText("Body")).toBeInTheDocument();
  });

  it("does not render label content when label is omitted", () => {
    const { container, getByText } = render(
      <SectionShell>
        <div>Body</div>
      </SectionShell>,
    );

    const root = getRootElement(container);

    expectStaticShell(root);
    expect(getByText("Body")).toBeInTheDocument();
    expect(root.children).toHaveLength(1);
  });

  it("passes className to the root element", () => {
    const { container } = render(
      <SectionShell label="Profile" className="custom-class">
        <div>Body</div>
      </SectionShell>,
    );

    expect(getRootElement(container)).toHaveClass("custom-class");
  });
});

describe("Section-like fields use SectionShell", () => {
  it("renders Section with a static shell", () => {
    const { container } = render(
      <Section
        field={{
          type: "section",
          path: "profile",
          label: "Profile",
          fields: [],
          collapsible: false,
        }}
        name="profile"
        registry={registry}
        context={{}}
      />,
    );

    expectStaticShell(getRootElement(container));
  });

  it("renders DiscriminatingForm with a static shell", () => {
    const { container } = renderInForm(
      <DiscriminatingForm
        field={{
          type: "discriminatingForm",
          path: "delivery",
          label: "Delivery",
          discriminatorLabel: "Mode",
          placeholder: "",
          collapsible: false,
          variants: [
            { label: "Disabled", value: "disabled", fields: null },
            { label: "Enabled", value: "enabled", fields: [] },
          ],
        }}
        name="delivery"
        registry={registry}
        context={{}}
      />,
      { delivery: null },
    );

    expectStaticShell(getFormRootElement(container));
  });

  it("renders TabsFieldComp with a static shell", () => {
    const { container } = render(
      <TabsFieldComp
        field={{
          type: "tabs",
          path: "settings",
          label: "Settings",
          collapsible: false,
          tabs: [{ label: "General", value: "general", fields: [] }],
        }}
        name="settings"
        registry={registry}
        context={{}}
      />,
    );

    expectStaticShell(getRootElement(container));
  });

  it("renders FormArray with a static shell", () => {
    const { container } = renderInForm(
      <FormArray
        field={{
          type: "formArray",
          path: "items",
          label: "Items",
          itemLabel: "Item",
          removeLabel: "Remove",
          collapsible: false,
          fields: [],
        }}
        name="items"
        registry={registry}
        context={{}}
      />,
      { items: [] },
    );

    expectStaticShell(getFormRootElement(container));
  });
});
