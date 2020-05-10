exports.checkTag = (hashtag) => {
  if (!hashtag) throw new Error('Please pass a hashtag');
  if (typeof hashtag !== 'string') throw new Error('Please pass a string hashtag');
  if (hashtag.length < 3) throw new Error('Please pass a hashtag atleast 3 characters');
  if (hashtag.length > 30) throw new Error('Please pass a hashtag with max 30 characters');
};
