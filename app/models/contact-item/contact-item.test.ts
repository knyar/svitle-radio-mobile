import { ContactItemModel, ContactItem } from "./contact-item"

test("can be created", () => {
  const instance: ContactItem = ContactItemModel.create({})

  expect(instance).toBeTruthy()
})