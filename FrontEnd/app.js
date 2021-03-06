const urls = {
  local: 'http://localhost:3000',
  cloud: 'https://kafka-twitter-socket.herokuapp.com/',
};

// const url = urls.local;
const url = urls.cloud;

const socket = io(url);

let currHashtag = null;
let tweets = 0;

const inputEl = document.getElementById('hashtag');
const hashtagBtn = document.getElementById('hashtagBtn');
const msgEl = document.getElementById('msg');
const tweetsContainer = document.getElementById('tweets');
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
  currHashtag = hashtag;
  tweets = 0;
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
    tweets++;
    msgEl.innerText = `#${currHashtag} - ${tweets} tweets`;
    const newTweetEl = createTweetBody(tweet);
    tweetsContainer.insertBefore(newTweetEl, tweetsContainer.firstChild);
    // console.log(tweet);
  }
});

socket.on('hashtag', (data) => {
  const { err, hashtag, msg } = data;
  if (!err) {
    msgEl.innerText = `Query received for #${hashtag}`;
  } else {
    msgEl.innerText = `Query error for #${hashtag} \n ${msg}`;
  }
});
