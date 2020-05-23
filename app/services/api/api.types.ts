import { GeneralApiProblem } from "./api-problem"

export type GetPreferencesResult = { kind: "ok"; preferences: any} | GeneralApiProblem
