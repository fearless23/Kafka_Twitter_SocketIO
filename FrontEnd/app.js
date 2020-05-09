const socket = io('http://localhost:3000');
const inputEl = document.getElementById('hashtag');
const hashtagBtn = document.getElementById('hashtagBtn');
const msg = document.getElementById('msg');
const tweets = document.getElementById('tweets');
hashtagBtn.classList.add('disabled');
hashtagBtn.addEventListener('click', () => {
  emitQuery(inputEl.value);
});

inputEl.addEventListener('keyup', (evt) => {
  if (inputEl.value.length < 4) {
    hashtagBtn.classList.add('disabled');
    return;
  } else {
    hashtagBtn.classList.remove('disabled');
  }

  if (evt.keyCode === 13) {
    emitQuery(inputEl.value);
  }
});

const emitQuery = (hashtag) => {
  inputEl.value = '';
  socket.emit('hashtag', hashtag);
};

const createTweetBody = (tweet) => {
  const xx = document.createElement('div');
  xx.classList.add('tweet');
  xx.innerHTML = tweetBody(tweet);
  return xx;
};

socket.on('tweet', (message) => {
  const { err, tweet } = message;
  if (!err) {
    const newTweetEl = createTweetBody(tweet);
    tweets.insertBefore(newTweetEl, tweets.firstChild);
  }
});

socket.on('hashtag', (message) => {
  const { err, hashtag } = message;
  if (!err) {
    msg.innerText = `Query received for #${hashtag}`;
  } else {
    msg.innerText = `Query error for #${hashtag}`;
  }
});
