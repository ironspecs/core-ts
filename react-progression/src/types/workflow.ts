/**
 * Owns the generic workflow operation contract. Host apps provide business
 * facts and context types while this package defines step, skip, and checker
 * shapes for immutable workflow plans.
 */

export type WorkflowOperationControl =
  | {
      kind: 'step';
      controls: {
        onProceed: () => void;
        onBack?: () => void;
      };
    }
  | {
      kind: 'skip';
      controls: {
        onDone: () => void;
        onCancel?: () => void;
      };
    };

export type WorkflowOperationParams<Facts, RuntimeContext> = {
  facts: Readonly<Facts>;
  context: RuntimeContext;
  operation: WorkflowOperationControl;
};

export type WorkflowOperationBase<Requirement extends string = string> = {
  operationId: string;
  checkerId: string;
  requirements: Requirement[];
};

export type WorkflowStepOperation<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
> = ((
  params: WorkflowOperationParams<Facts, RuntimeContext> & {
    operation: Extract<WorkflowOperationControl, { kind: 'step' }>;
  },
) => Promise<RuntimeContext> | RuntimeContext) &
  WorkflowOperationBase<Requirement> & {
    kind: 'step';
    blockId: BlockId;
  };

export type WorkflowSkipOperation<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  SkipId extends string = string,
> = ((
  params: WorkflowOperationParams<Facts, RuntimeContext> & {
    operation: Extract<WorkflowOperationControl, { kind: 'skip' }>;
  },
) => Promise<RuntimeContext> | RuntimeContext) &
  WorkflowOperationBase<Requirement> & {
    kind: 'skip';
    skipId: SkipId;
  };

export type WorkflowOperation<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
> =
  | WorkflowStepOperation<Facts, RuntimeContext, Requirement, BlockId>
  | WorkflowSkipOperation<Facts, RuntimeContext, Requirement, SkipId>;

export type WorkflowChecker<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
> = {
  id: string;
  shouldHandle: (facts: Readonly<Facts>) => boolean;
  createOperations: (
    facts: Readonly<Facts>,
    context: RuntimeContext,
  ) =>
    | Promise<
        WorkflowOperation<
          Facts,
          RuntimeContext,
          Requirement,
          BlockId,
          SkipId
        >[]
      >
    | WorkflowOperation<
        Facts,
        RuntimeContext,
        Requirement,
        BlockId,
        SkipId
      >[];
};
