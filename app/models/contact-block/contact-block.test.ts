import { ContactBlockModel, ContactBlock } from "./contact-block"

test("can be created", () => {
  const instance: ContactBlock = ContactBlockModel.create({})

  expect(instance).toBeTruthy()
})
