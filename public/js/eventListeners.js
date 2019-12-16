$(document).ready(() => {
  d3.select('.vehicleId').text('2NKHHJ7X2EM422350');
  d3.select('.businessYear').text('2014');
  // DATA TABLE PAGINATION BEGIN
  window.ofs = 0;
  window.pag = 25;
  window.updateResult = () => {
    let totFilteredRecs = xf.groupAll().value();
    ofs = ofs >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / pag) * pag : ofs;
    ofs = ofs < 0 ? 0 : ofs;
    chart.dataTable.beginSlice(ofs);
    chart.dataTable.endSlice(ofs + pag);
  };
  window.displayResult = () => {
    let totFilteredRecs = xf.groupAll().value();
    d3.selectAll('.pagNext').attr('disabled', ofs + pag >= totFilteredRecs ? 'true' : null);
    d3.selectAll('.pagPrev').attr('disabled', ofs - pag < 0 ? 'true' : null);
    d3.selectAll('.pagStart').attr('style', 'font-weight: bold;').text(ofs);
    d3.selectAll('.pagEnd').attr('style', 'font-weight: bold;').text(ofs + pag - 1);
    d3.selectAll('.pagTotalSize').attr('style', 'font-weight: bold;').text(totFilteredRecs);
    if (totFilteredRecs != xf.size()) {
      d3.selectAll('.pagTotalSizeDesc').html('(Total: <strong>' + xf.size() + '</strong> )');
      d3.select('.resetAll').attr('style', 'display:inline;');
    } else {
      d3.selectAll('.pagTotalSizeDesc').text('');
      d3.select('.resetAll').attr('style', 'display:none;');
    }
  };
  window.prev = () => {
    ofs -= pag;
    updateResult();
    chart.dataTable.redraw();
  };
  window.next = () => {
    ofs += pag;
    updateResult();
    chart.dataTable.redraw();
  };
  // DATA TABLE PAGINATION END
  // Map RESIZE BEGIN
  $(window).on('resize', function() {
    setTimeout(() => {
      let map = chart.marker.map();
      $('#map .dc-leaflet')
        .css('height', `${$('.mapContainer').height()-30}px`)
        .css('width', `${$('.mapContainer').width()}px`);
      map.invalidateSize();
    }, 400);
  });
  $(window).trigger('resize');
  // Map RESIZE END
  $('.toTopBtn').on('click', () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
});
