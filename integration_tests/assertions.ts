export const assertHasRequestCount = count => response => {
  const result = JSON.parse(response.text)
  expect(result.count).to.equal(count)
}

export default {
  assertHasRequestCount,
}
