$(document).ready(function () {
  const subLocations = $('#subLocation')
  $('#location').change(function (e) {
    const locationId = e.target.value

    if (locationId) {
      $.ajax({
        headers: {
          Accept: 'text/plain; charset=utf-8',
        },
        data: {
          locationId,
        },
      })
        .fail(function () {
          subLocations.prop('disabled', false)
          subLocations.val('Select')
        })
        .then(function (partialHtml) {
          subLocations.prop('disabled', false)
          subLocations.html(partialHtml)
        })
    }
  })
})
