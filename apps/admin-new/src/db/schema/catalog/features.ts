import { pgTable, uuid, text, timestamp, boolean, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { featureKind } from "../enums";

// ============================================================
// catalog.features — Master list of product capabilities
// ============================================================
export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  kind: featureKind("kind").notNull(),
  unitName: text("unit_name"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// catalog.feature_dependencies — Feature-to-feature dependency rules
// ============================================================
export const featureDependencies = pgTable(
  "feature_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id),
    dependsOnFeatureId: uuid("depends_on_feature_id")
      .notNull()
      .references(() => features.id),
    isHardDependency: boolean("is_hard_dependency").notNull().default(true),
    conditionConfig: jsonb("condition_config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_feature_dep").on(table.featureId, table.dependsOnFeatureId),
    check("chk_no_self_dep", sql`${table.featureId} <> ${table.dependsOnFeatureId}`),
  ],
);