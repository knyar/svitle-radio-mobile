/// <reference types="node" />
import { execFileSync } from "child_process"
import { mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

const script = join(__dirname, "failed-flows.sh")

function run(reportPath: string): string {
  return execFileSync("bash", [script, reportPath], { encoding: "utf8" }).trim()
}

function report(testcases: string): string {
  const dir = mkdtempSync(join(tmpdir(), "failed-flows-"))
  const file = join(dir, "maestro-report.xml")
  writeFileSync(
    file,
    `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n<testsuite name="Test Suite" device="emulator-5554" tests="2" failures="1" time="27">\n${testcases}\n</testsuite>\n</testsuites>\n`,
  )
  return file
}

test("lists the flows whose status is not SUCCESS", () => {
  const file = report(
    [
      '<testcase id="01-launch" name="01-launch" classname="01-launch" time="6.1" status="ERROR">',
      '<failure message="Unknown error">',
      "Unknown error",
      "</failure>",
      "</testcase>",
      '<testcase id="02-play-pause" name="02-play-pause" classname="02-play-pause" time="20.3" status="SUCCESS"/>',
      '<testcase id="05-switch-station" name="05-switch-station" classname="05-switch-station" time="9.0" status="FAILURE"/>',
    ].join("\n"),
  )
  expect(run(file)).toBe("01-launch, 05-switch-station")
})

test("reports unknown flow when every flow succeeded", () => {
  const file = report(
    '<testcase id="01-launch" name="01-launch" classname="01-launch" time="6.1" status="SUCCESS"/>',
  )
  expect(run(file)).toBe("unknown flow")
})

test("reports unknown flow for a missing or empty report", () => {
  expect(run(join(tmpdir(), "does-not-exist.xml"))).toBe("unknown flow")
  expect(run(report(""))).toBe("unknown flow")
})

test("ignores testcase tags without a status attribute", () => {
  const file = report('<testcase name="01-launch" classname="01-launch" time="6.1">\n</testcase>')
  expect(run(file)).toBe("unknown flow")
})
