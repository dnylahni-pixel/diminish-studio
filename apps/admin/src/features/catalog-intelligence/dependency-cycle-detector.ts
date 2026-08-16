// =============================================================================
// Feature Dependency Cycle / Missing Dependency Detector
// -----------------------------------------------------------------------------
// Capability: detectFeatureDependencyCycles
// Tables used: features, feature_dependencies
// Problem solved: `feature_dependencies` is a self-referencing graph with no
// database-level cycle guard (a check constraint can stop A->A but not
// A->B->A). A cycle silently breaks the entitlement resolver (a feature can
// never become grantable). A dangling `dependsOnFeatureId` that points at a
// feature row that no longer exists is equally fatal and invisible without a
// dedicated scan.
// Method: iterative DFS with a recursion stack (equivalent to what a
// recursive CTE with a `path` array + cycle guard would do in SQL — see
// sql/integrity/020_fn_detect_feature_dependency_cycles.sql for the
// server-side twin of this exact algorithm).
// Consumer: catalog-intelligence publish validator, data-quality scorecard.
// =============================================================================

import type { FeatureDependencyRow, FeatureRow, UUID } from "@/shared/dataset-types";

export interface DependencyCycleFinding {
  cycle: UUID[];
  cycleFeatureKeys: string[];
}

export interface MissingDependencyFinding {
  featureId: UUID;
  featureKey: string;
  missingDependsOnFeatureId: UUID;
}

export interface FeatureDependencyGraphReport {
  cycles: DependencyCycleFinding[];
  missingDependencies: MissingDependencyFinding[];
  isAcyclic: boolean;
}

export function detectFeatureDependencyCycles(
  features: FeatureRow[],
  dependencies: FeatureDependencyRow[],
): FeatureDependencyGraphReport {
  const featureById = new Map(features.map((feature) => [feature.id, feature]));
  const adjacency = new Map<UUID, UUID[]>();
  const missingDependencies: MissingDependencyFinding[] = [];

  for (const dependency of dependencies) {
    if (!featureById.has(dependency.dependsOnFeatureId)) {
      const feature = featureById.get(dependency.featureId);
      missingDependencies.push({
        featureId: dependency.featureId,
        featureKey: feature?.key ?? dependency.featureId,
        missingDependsOnFeatureId: dependency.dependsOnFeatureId,
      });
      continue;
    }
    const list = adjacency.get(dependency.featureId) ?? [];
    list.push(dependency.dependsOnFeatureId);
    adjacency.set(dependency.featureId, list);
  }

  const visited = new Set<UUID>();
  const stack = new Set<UUID>();
  const path: UUID[] = [];
  const cycles: DependencyCycleFinding[] = [];
  const reportedCycleSignatures = new Set<string>();

  function visit(nodeId: UUID) {
    visited.add(nodeId);
    stack.add(nodeId);
    path.push(nodeId);

    for (const neighbour of adjacency.get(nodeId) ?? []) {
      if (!visited.has(neighbour)) {
        visit(neighbour);
      } else if (stack.has(neighbour)) {
        const cycleStartIndex = path.indexOf(neighbour);
        const cycle = path.slice(cycleStartIndex);
        const signature = [...cycle].sort().join("|");
        if (!reportedCycleSignatures.has(signature)) {
          reportedCycleSignatures.add(signature);
          cycles.push({
            cycle,
            cycleFeatureKeys: cycle.map((id) => featureById.get(id)?.key ?? id),
          });
        }
      }
    }

    stack.delete(nodeId);
    path.pop();
  }

  for (const feature of features) {
    if (!visited.has(feature.id)) {
      visit(feature.id);
    }
  }

  return { cycles, missingDependencies, isAcyclic: cycles.length === 0 };
}
