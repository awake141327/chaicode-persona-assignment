const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

// Searches YouTube for the keyword, restricted to the given channels
// (YouTube API only allows one channelId per request, so we fire one
// request per channel and merge the results).
// Returns [] gracefully if no API key is configured.
export async function searchChannelVideos(keyword, channels, maxPerChannel = 2) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !channels.length) {
    return [];
  }

  const searches = channels.map(async (channel) => {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "relevance",
      maxResults: String(maxPerChannel),
      q: keyword,
      channelId: channel.channelId,
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);

    if (!response.ok) {
      console.error(`YouTube search failed for ${channel.handle}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  });

  const results = await Promise.all(searches);
  return results.flat();
}
