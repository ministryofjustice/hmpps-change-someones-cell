export const assertHasRequestCount = (count: number) => (response: unknown) => {
  const result = JSON.parse((response as { text: string }).text)
  expect(result.count).to.equal(count)
}

export default {
  assertHasRequestCount,
}
