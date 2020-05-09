const convertDate = (timeMS) => {
  const d = new Date(parseInt(timeMS));
  const month_names = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = d.getDate();
  const month_index = d.getMonth();
  const year = d.getFullYear();
  const hour = d.getHours();
  const min = d.getMinutes();

  let am_pm = 'AM';

  if (hour > 12) pm = 'PM';

  return {
    date: `${day} ${month_names[month_index]} ${year}`,
    time: `${hour % 12}:${min} ${am_pm}`,
  };
};

const tweetBody = (tweet) => {
  const {date,time} = convertDate(tweet.timeMS);
  return `
  <div class="top">
    <div class="top-left">
      <div>
        <img
          src="${tweet.user.img}"
          alt="USER IMAGE"
        />
      </div>
      <div class="names">
        <div class="name">${tweet.user.name}</div>
        <div class="username">${tweet.user.screenName}</div>
      </div>
    </div>
    <div class="top-right">
      <div class="date">${date}</div>
      <div class="time">${time}</div>
    </div>
  </div>
  <div class="content">${tweet.text}</div>
  <div class="footer">
    <div class="retweets">
      <i class="fas fa-retweet"></i>
      <span>${tweet.retweets}</span>
    </div>
    <div class="favorites">
      <i class="fas fa-heart"></i>
      <span>${tweet.favorites}</span>
    </div>
  </div>`;
};
