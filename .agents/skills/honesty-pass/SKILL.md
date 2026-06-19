---
name: honesty-pass
description: Use when TypeScript code must be forced into honest contracts. This skill defines mandatory rules for functions whose names, return types, and caller behavior do not agree.
---

# Honesty Pass

This is a hard gate. These are mandatory rules. If code violates a rule, rewrite the code.

This skill is a repository of fraud patterns, which are hard violations that are unacceptable rot and must be removed.

When this skill is invoked, immediately apply it to the current changeset unless the user names a narrower target.

## Dishonest prerequisites

Functions with dishonest prerequisites accept raw, under-proven data, then start slicing, converting, indexing, or asserting as if the required structure was already guaranteed. When that guarantee is missing, it throws. The result is branchy, weaker, less optimizable code that makes TypeScript sit out while the function improvises its own broken proof system. That is not a runtime surprise. That is a boundary failure.

The solution is to move the proof upward. If the function needs validated bytes, exact tuple lengths, a resolved handle, a loaded definition, or a specific mode, it must demand those as inputs. Honest input removes most throws because the bad states stop being representable at the point of use. If a function would throw because of a missing required value, make the value an input instead.

## Case 1

BAD:

```ts
function schematicPointerWorldPerPixel(
  orthographicHeight: number,
  windowHeight: number,
  viewHeightScale: number,
): number {
  assertPositiveFinite(
    orthographicHeight,
    "schematic pointer orthographic height should be positive and finite",
  );
  assertPositiveFinite(
    windowHeight,
    "schematic pointer window height should be positive and finite",
  );
  assertPositiveFinite(
    viewHeightScale,
    "schematic pointer view height scale should be positive and finite",
  );
  return (orthographicHeight / windowHeight) * viewHeightScale;
}
```

GOOD: Make the restriction a prerequisite.

```ts
function worldUnitsPerPixelFromOrthographicHeight(params: {
  orthographicHeight: PositiveFiniteNumber;
  windowHeight: PositiveFiniteNumber;
  viewHeightScale: PositiveFiniteNumber;
}): number {
  return (
    (params.orthographicHeight.value / params.windowHeight.value) *
    params.viewHeightScale.value
  );
}
```

GOOD: Not assert at all, not your responsibility.

```ts
function worldUnitsPerPixelFromOrthographicHeight(
  orthographicHeight: number,
  windowHeight: number,
  viewHeightScale: number,
): number {
  return (orthographicHeight / windowHeight) * viewHeightScale;
}
```

## Case 2

BAD:

```ts
function animateCameraToSelectedDeck(
  camera: CameraController,
  targetBounds: CameraTargetBounds,
): void {
  if (camera.mode() === "orbit") {
    throw new Error("deck alignment should only run in cutaway modes");
  }
  const position = camera.target().target();
  camera.setTarget(
    targetBounds.clampTarget({
      x: position.x,
      y: deckTargetY(camera.deck().selectedLayer()),
      z: position.z,
    }),
    "smooth",
  );
}
```

GOOD: Accept a narrower type that already proves this operation is valid.

```ts
function animateCutawayCameraToSelectedDeck(
  camera: CutawayCameraController,
  targetBounds: CameraTargetBounds,
): void;
```

## Case 3

BAD: getSafe is vague, get hides a throw, the type is mixing storage access with caller policy about required membership.

```ts
class Definitions<K, V> {
  getSafe(key: K): V | undefined {
    return this.map.get(key);
  }

  get(key: K): V {
    const value = this.getSafe(key);
    if (!value) {
      throw new Error(
        `${this.definitionsLabel} should contain key ${String(key)}`,
      );
    }
    return value;
  }
}
```

GOOD: deleting the throwing get, keeping only optional lookup at this boundary, and reshaping callers so strict functions take `V` as an input prerequisite.

```ts
class Definitions<K, V> {
  get(key: K): V | undefined {
    return this.map.get(key);
  }
}
```

Then move the prerequisite upward:

```ts
const definition = definitions.get(key);
if (!definition) {
  // handle it.
  return;
}
```

## Dishonest Return Types

Dishonest return types are fake certainty. If a function name promises a type, it must return that type. Not `T | undefined`, a throw, a partial shell, or a value the caller has to assert or throw to recover. That is a boundary lie.

The solution is to move the choice upward: the function must DEMAND all prerequisites in its parameters such that it can guarantee the output.

### Case 1

BAD: `placeEntityPreview(...)` does not return a directly usable preview.

```ts
const preview = placeEntityPreview(sceneState.interaction());
if (!preview.ghost) {
  throw new Error("place-entity preview should output ghost preview state");
}
```

```ts
const preview = placeEntityPreview(...);
assert(preview.somePreviewField !== undefined);
```

### Case 2

BAD: this operation requires a valid occupied render chunk slot, slot alone is not enough input to prove that.

```ts
function updateRenderChunkSlot(slot: RenderChunkSlot /* ... */): void {
  const retained = this.renderChunkSlots.get(slot);
  if (!retained) {
    throw new Error(`camera render chunk slot ${slot} should exist`);
  }

  // work on retained
}
```

GOOD:

```ts
function updateRenderChunkRetained(
  retained: RenderChunkRetained,
  /* ... */
): void {
  // work on retained
}
```

## Dishonest content

Dishonest content is not just weak contracts, its actively lying about what it is.

The code uses domain words for generic behavior, wraps one concept in another name without adding a contract, or hides real behavior behind a more respectable surface. This is worse than an awkward API. It manufactures false meaning. It teaches the reader the wrong model of the code, invites copy-paste mutations of the same lie, and spreads counterfeit specificity across the codebase.

The solution is to just delete it and merge upward, drawing boundaries along more honest lines.

BAD: fakery.

```ts
function u32Layer(layer: number, name: string): number {
  if (!Number.isInteger(layer) || layer < 0) {
    throw new Error(`${name} should be nonnegative`);
  }
  return layer;
}
```

First, it lies about domain meaning. u32Layer claims to know something about layers, but it does not. It is just a generic integer conversion.

Second, it lies about responsibility. It looks like a small conversion helper, but it secretly owns throw policy.

Third, it lies about reusability. Because it is named for one domain concept while doing generic work, it invites copy-paste variants like:

- u32Row
- u32Column
- u32Depth
- u32Index

That is how codebases rot. Generic behavior gets wrapped in fake domain names, and every caller starts depending on tiny throw-decorated helpers instead of proving prerequisites honestly.

So this kind of function is dangerous because it:

- hides a generic conversion behind fake domain vocabulary
- hides a throw behind a helper-looking name
- couples domain wording to low-level numeric conversion
- encourages duplication of the same bad pattern everywhere

BAD: Results that throw.

```ts
function glbJsonRootValue(absolutePath: string): JsonValue {
  const bytes = readFileSync(absolutePath);
  if (bytes.length < 20) {
    throw new Error(`GLB \`${absolutePath}\` is too short`);
  }
  const magicBytes = bytes.subarray(0, 4);
  if (magicBytes.length !== 4) {
    throw new Error("GLB header magic slice should be exactly four bytes");
  }
  const magic = magicBytes.readUInt32LE(0);
  if (magic !== 0x4654_6c67) {
    throw new Error(`file \`${absolutePath}\` is not a GLB container`);
  }
  const jsonChunkLengthBytes = bytes.subarray(12, 16);
  if (jsonChunkLengthBytes.length !== 4) {
    throw new Error("GLB JSON chunk length slice should be exactly four bytes");
  }
  const jsonChunkLength = jsonChunkLengthBytes.readUInt32LE(0);
  const jsonChunkKindBytes = bytes.subarray(16, 20);
  if (jsonChunkKindBytes.length !== 4) {
    throw new Error("GLB JSON chunk kind slice should be exactly four bytes");
  }
  const jsonChunkKind = jsonChunkKindBytes.readUInt32LE(0);
  if (jsonChunkKind !== 0x4e4f_534a) {
    throw new Error(`GLB \`${absolutePath}\` is missing a JSON chunk`);
  }
  const jsonEnd = 20 + jsonChunkLength;
  if (jsonEnd > bytes.length) {
    throw new Error(
      `GLB \`${absolutePath}\` declares a JSON chunk longer than the file`,
    );
  }
  return JSON.parse(bytes.subarray(20, jsonEnd).toString("utf8")) as JsonValue;
}
```

It is dishonest because it claims to be a boundary parser, but it still hides extra throw paths inside boundary-data handling. The worst part is this pattern:

```ts
const magicBytes = bytes.subarray(0, 4);
if (magicBytes.length !== 4) {
  throw new Error("GLB header magic slice should be exactly four bytes");
}
```

and the two copies below it. The rule violation is boundary parsing, hidden throw paths on external data, and throw-based slice conversion where the real honest shape is infallible extraction after prerequisite proof.

The honest fix is to remove the fake fallibility at the slice-conversion step entirely: extract the four-byte arrays in a way that is structurally infallible after the length check or return a typed error if you want that shape checked dynamically. But the better fix is to check the length ahead of time, or demand the length in the params. That's not just cleaner, it's faster, and TypeScript becomes your enforcer. Dishonest boundaries are not just confusing. They are often slower, branchier, and weaker than the honest alternative.

## Maybe functions

Maybe functions are often indecision forwarders, and a structural lie. They almost promise something, but back out coyly with a "lol just kidding!". It's coward code that refuses to prove the prerequisite, refuses to handle the absence, and instead turned uncertainty into everyone else's problem.

The solution is to cut it in half. One early function finds or proves the prerequisites. The next function demands them and actually guarantees the result.

BAD:

```ts
function maybePlaceItemPreview(
  interaction: InGameInteractionState,
): PlaceItemPreview | undefined {
  const itemKindId = interaction.placeItem().activeItemKindId();
  if (!itemKindId) {
    return undefined;
  }
  const contact = interaction.surfaceContact();
  if (!contact) {
    return undefined;
  }
  const previewCell = solidPlacementCell(contact.support());
  const catalogEntry = itemBrowserCatalogEntryById(itemKindId);
  const ghost: GhostPreviewState = {
    anchor: normalizedCellRangeFromEndpoints(
      previewCell,
      previewCell,
    ).centerPosition(),
    displayState: "valid",
    previewScale: vec3FromCellSize(catalogEntry.previewCellSize),
  };
  const location = npcWorldCellItemLocation(contact.support());
  const commit = location ? { itemKindId, location } : undefined;
  return { ghost, commit };
}
```

This is many functions jammed together, they need to be split into parts that can be honest about what they guaranteed.

GOOD:

```ts
const prerequisites = placeItemPreviewPrerequisites(interaction);
if (!prerequisites) {
  clearPlaceItemPreviewState(...);
  return;
}

const preview = placeItemPreview(prerequisites);
```

BAD:

```ts
function maybeDynamicOffset(
  dynamicOffset: NonMaxNumber | undefined,
): PhaseItemExtraIndex {
  return dynamicOffset === undefined
    ? { kind: "none" }
    : { kind: "dynamicOffset", value: dynamicOffset };
}
```

This might seem fine, but it's the same problem because "PhaseItemExtraIndex" only exists to be a long-distance flag, an `undefined` smuggling container. The code did not decide anything, it just pushed indecision farther downstream.

## Thesaurus code

Thesaurus code is bullshit indirection. It's semantic spam that does not add a contract, an invariant, a transformation, or a boundary. It just takes one concept, gives it a second name, and forces the reader to pretend those names mean different things. Nothing was clarified. Nothing was made safer.

The solution is to just delete the rename and merge upward.

### Examples

BAD: This does not define a new contract. It just renames has into containsItemStack.

```ts
function containsItemStack(itemStackId: number): boolean {
  return this.itemRecords.has(itemStackId);
}
```

BAD:

```ts
function applyAuthoritativeMutation(
  mutation: ModuleGraphMutation,
  catalog: NodeManifestResource,
): Result<void, ModuleGraphError> {
  return this.applyMutation(mutation, catalog);
}
```

applyMutation already means mutation application on that graph. applyAuthoritativeMutation just renames the same action with a more dramatic noun phrase.

BAD: Types used as field names.

```ts
class NpcRigProfileId {
  constructor(private readonly value: string) {}

  asString(): string {
    return this.value;
  }
}
```

That's just a string with helpers, not an id. Name the field as an id, not the type.

BAD:

```ts
type RetainedMeshModelRoot = Entity;
```

That's literally the entire type--just a name to hide the original type.

BAD:

```ts
class NodeManifestResource {
  constructor(readonly manifest: NodeManifest) {}
}
```

BAD:

```ts
class AuthoritativeModuleGraph {
  constructor(readonly graph: ModuleGraph) {}
}
```

For AuthoritativeModuleGraph and NodeManifestResource, they only exist to carry the thing inside and to give it more context. That is pointless, dishonest, and even hurts performance.

BAD:

```ts
type ProjectionMesh = MeshHandle;
```

## Extreme examples

BAD: Extreme example of bad TypeScript code.

```ts
function meshFloat32x4Attribute(
  mesh: Mesh,
  attributeId: MeshVertexAttributeId,
): Array<[number, number, number, number]> {
  const attribute = mesh.attribute(attributeId);
  if (!attribute) {
    throw new Error(
      `retained GPU mesh payload should keep Float32x4 attribute ${attributeId}`,
    );
  }
  if (attribute.kind !== "float32x4") {
    throw new Error(
      `retained GPU mesh payload expected Float32x4, found ${attribute.kind}`,
    );
  }
  return attribute.values.map((value) => [...value]);
}
```

It fails on:

- dishonest name
- dishonest inputs
- hidden throw policy
- hidden clone policy
- fake generality
- domain truth only visible in the throw text

## Workflow

Review the current changeset only for honesty.

Use the examples and rules above as hard gates. Do not excuse, defer, or normalize dishonest code because it is small, convenient, or already working.

For each dishonest function, type, or boundary:

1. Identify the exact lie.
2. Identify the honest boundary and the honest prerequisite.
3. Decide the strongest honest shape.
4. Implement the fix immediately.
5. Re-check the surrounding callers and callees, because dishonesty usually spreads across the boundary.

Repeat until the entire changeset is honest.

Do not leave dishonest code behind for a later cleanup pass.
Do not commit dishonest code.
Do not stop at renaming if the structure is still lying.
