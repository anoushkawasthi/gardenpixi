/**
 * Pixel Garden — project content schema (TRD v1.0 companion).
 * Validate at dev startup: see src/main.tsx
 */

import { z } from "zod";

export const plantStyleSchema = z.enum([
  "monstera",
  "glowing_flower",
  "spider",
  "round_leaf",
  "fern",
  "cactus",
]);

export const projectTierSchema = z.enum(["flagship", "featured", "side"]);

export const projectStatusSchema = z.enum(["active", "shipped", "archived"]);

const linksSchema = z
  .object({
    live: z.string().url().optional(),
    github: z.string().url().optional(),
  })
  .strict();

const worldPointSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
  })
  .strict();

export const projectSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use kebab-case ids"),

    tier: projectTierSchema,

    name: z.string().min(1).max(120),

    /** Shown on plants in Zombie Mode (PRD §6.3), e.g. "CampusTracker.exe" */
    zombieExeName: z
      .string()
      .min(1)
      .max(64)
      .regex(/\.exe$/i, "Zombie label should end with .exe per PRD examples"),

    plantStyle: plantStyleSchema,

    /** World-space anchor in authoring pixels (TRD — design canvas 1200×700) */
    world: worldPointSchema,

    problem: z.string().min(10).max(2000),
    solution: z.string().min(10).max(2000),

    tech: z.array(z.string().min(1)).min(1).max(24),

    keyFeatures: z.array(z.string().min(1)).max(4).default([]),

    status: projectStatusSchema,

    links: linksSchema,
  })
  .superRefine((row, ctx) => {
    if (row.tier === "side") {
      if (row.keyFeatures.length > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: 2,
          type: "array",
          inclusive: true,
          path: ["keyFeatures"],
          message: "side tier allows at most 2 key features",
        });
      }
    }
  });

export const projectsSchema = z.array(projectSchema).min(1).max(24);

export type Project = z.infer<typeof projectSchema>;
export type PlantStyle = z.infer<typeof plantStyleSchema>;
export type ProjectTier = z.infer<typeof projectTierSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
