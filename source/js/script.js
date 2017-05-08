(function(){
  // Share
  var shareLink = document.querySelector('.article-share-link');
  var shareBox = document.querySelector('.article-share-box');
  if(shareLink && shareBox) {
    document.querySelector('body').addEventListener('click', function(evt) {
      shareBox.classList.remove('on');
    });

    shareLink.addEventListener('click', function(evt) {
      evt.stopPropagation();
      var url = evt.target.dataset.url,
      encodedUrl = encodeURIComponent(url),
      offset = {
        top: evt.target.offsetTop - 10,
        left: evt.target.offsetLeft
      };

      shareBox.style.top = offset.top + 'px';
      shareBox.style.left = offset.left + 'px';
      shareBox.classList.add('on');
    });
  }
})();
