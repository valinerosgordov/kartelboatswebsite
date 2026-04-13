(function() {
const videoWrappers = document.querySelectorAll('.route-video-wrapper');

videoWrappers.forEach(wrapper => {
    const video = wrapper.querySelector('.route-video');
    const playBtn = wrapper.querySelector('.route-play-btn');
    
    if (!video || !playBtn) return;

    // Hide play button when video starts playing
    video.addEventListener('play', () => {
        playBtn.style.opacity = '0';
        playBtn.style.pointerEvents = 'none';
    });

    // Show play button when video is paused
    video.addEventListener('pause', () => {
        playBtn.style.opacity = '0.9';
        playBtn.style.pointerEvents = 'none';
    });

    // Show play button when video ends
    video.addEventListener('ended', () => {
        playBtn.style.opacity = '0.9';
        playBtn.style.pointerEvents = 'none';
    });

    // Click on wrapper triggers video play
    wrapper.addEventListener('click', (e) => {
        if (e.target === wrapper || e.target === playBtn) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    });
});
})();
</script>
