/**
 * Static, documented reference data used to populate region/GPU selectors in
 * create/edit forms. Sourced directly from the enum values declared in the
 * vendor's OpenAPI contract (https://rest.runpod.io/v1/openapi.json,
 * `dataCenterIds`/`gpuTypeIds` enums on Pod/Endpoint/NetworkVolume schemas —
 * see docs/official-sources.md row 3). This is reference data for building
 * forms, not a live "list data centers/GPU availability" API call — Runpod
 * does not document one (see docs/service-capability-matrix.md, "Networking").
 */

import type { MessageKey, TFunction } from "@/i18n/translate";

/**
 * Localize a reference-options list by translating each `label` message key
 * through the provided `t` function. Pure — takes `t` as an argument so this
 * module stays hook-free and importable from both client and server code.
 */
export function localizeReferenceOptions<
  T extends { value: string; label: string },
>(
  options: readonly T[],
  t: TFunction,
): T[] {
  return options.map((option) => ({ ...option, label: t(option.label as MessageKey) }));
}

export const RUNPOD_DATA_CENTER_OPTIONS = [
  { value: "EU-RO-1", label: "runpod.dataCenter.euRo1" },
  { value: "CA-MTL-1", label: "runpod.dataCenter.caMtl1" },
  { value: "CA-MTL-2", label: "runpod.dataCenter.caMtl2" },
  { value: "CA-MTL-3", label: "runpod.dataCenter.caMtl3" },
  { value: "EU-SE-1", label: "runpod.dataCenter.euSe1" },
  { value: "US-IL-1", label: "runpod.dataCenter.usIl1" },
  { value: "EUR-IS-1", label: "runpod.dataCenter.eurIs1" },
  { value: "EUR-IS-2", label: "runpod.dataCenter.eurIs2" },
  { value: "EUR-IS-3", label: "runpod.dataCenter.eurIs3" },
  { value: "EU-CZ-1", label: "runpod.dataCenter.euCz1" },
  { value: "US-TX-1", label: "runpod.dataCenter.usTx1" },
  { value: "US-TX-3", label: "runpod.dataCenter.usTx3" },
  { value: "US-TX-4", label: "runpod.dataCenter.usTx4" },
  { value: "US-KS-2", label: "runpod.dataCenter.usKs2" },
  { value: "US-KS-3", label: "runpod.dataCenter.usKs3" },
  { value: "US-GA-1", label: "runpod.dataCenter.usGa1" },
  { value: "US-GA-2", label: "runpod.dataCenter.usGa2" },
  { value: "US-WA-1", label: "runpod.dataCenter.usWa1" },
  { value: "US-CA-2", label: "runpod.dataCenter.usCa2" },
  { value: "US-NC-1", label: "runpod.dataCenter.usNc1" },
  { value: "US-DE-1", label: "runpod.dataCenter.usDe1" },
  { value: "US-MD-1", label: "runpod.dataCenter.usMd1" },
  { value: "EU-NL-1", label: "runpod.dataCenter.euNl1" },
  { value: "EU-FR-1", label: "runpod.dataCenter.euFr1" },
  { value: "EUR-NO-1", label: "runpod.dataCenter.eurNo1" },
  { value: "OC-AU-1", label: "runpod.dataCenter.ocAu1" },
  { value: "AP-JP-1", label: "runpod.dataCenter.apJp1" },
  { value: "AP-IN-1", label: "runpod.dataCenter.apIn1" },
];

export const RUNPOD_GPU_TYPE_OPTIONS = [
  { value: "NVIDIA GeForce RTX 4090", label: "NVIDIA GeForce RTX 4090" },
  { value: "NVIDIA GeForce RTX 3090", label: "NVIDIA GeForce RTX 3090" },
  { value: "NVIDIA RTX A5000", label: "NVIDIA RTX A5000" },
  { value: "NVIDIA RTX A6000", label: "NVIDIA RTX A6000" },
  { value: "NVIDIA RTX 4000 Ada Generation", label: "NVIDIA RTX 4000 Ada Generation" },
  { value: "NVIDIA RTX 6000 Ada Generation", label: "NVIDIA RTX 6000 Ada Generation" },
  { value: "NVIDIA L4", label: "NVIDIA L4" },
  { value: "NVIDIA L40", label: "NVIDIA L40" },
  { value: "NVIDIA L40S", label: "NVIDIA L40S" },
  { value: "NVIDIA A100 80GB PCIe", label: "NVIDIA A100 80GB PCIe" },
  { value: "NVIDIA A100-SXM4-80GB", label: "NVIDIA A100-SXM4-80GB" },
  { value: "NVIDIA H100 PCIe", label: "NVIDIA H100 PCIe" },
  { value: "NVIDIA H100 80GB HBM3", label: "NVIDIA H100 80GB HBM3" },
  { value: "NVIDIA H200", label: "NVIDIA H200" },
  { value: "NVIDIA B200", label: "NVIDIA B200" },
];

export const RUNPOD_CPU_FLAVOR_OPTIONS = [
  { value: "cpu3c", label: "runpod.cpuFlavor.cpu3c" },
  { value: "cpu3g", label: "runpod.cpuFlavor.cpu3g" },
  { value: "cpu3m", label: "runpod.cpuFlavor.cpu3m" },
  { value: "cpu5c", label: "runpod.cpuFlavor.cpu5c" },
  { value: "cpu5g", label: "runpod.cpuFlavor.cpu5g" },
  { value: "cpu5m", label: "runpod.cpuFlavor.cpu5m" },
];
