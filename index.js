require('dotenv').config();
const { send } = require('micro')
const got = require('got');
const spacetime = require('spacetime');

const dateFormat = 'y-MM-ddTHH:mm:ss';

module.exports = async (req, res) => {
  const now = spacetime.now('Asia/Singapore');
  const start_date_range = now.startOf('day').format(dateFormat);
  const end_date_range = now.endOf('day').format(dateFormat);

  got('https://api.meetup.com/find/upcoming_events', {
    query: {
      key: process.env.MEETUP_API_KEY,
      start_date_range,
      end_date_range,
      topic_category: 292, // Tech
      order: 'time',
      fields: 'group_topics',
      lat: '1.3521',
      lon: '103.8198',
      page: 100,
      radius: 16, // miles
    },
    json: true,
  }).then(response => {
    const events = response.body.events.filter(event => {
      const topics = event.group.topics.map(t => t.name).join();
      console.log(`⏩  ${event.name} || ${event.visibility} || ${event.venue.country}\n\t${topics}`);
      return event.visibility === 'public' && event.venue && /^sg$/i.test(event.venue.country) && !/bitcoin|blockchain|business/i.test(topics);
    }).map(event => {
      const { name, time, local_date, local_time, venue, group, link } = event;
      const { lat, lon, address_1, address_2, address_3, city, country } = venue;
      return {
        name,
        time,
        local_date,
        local_time,
        venue: {
          lat,
          lng: lon,
          name: venue.name,
          address_1,
          address_2,
          address_3,
          city,
          country,
        },
        group: group.name,
        link,
      };
    });

    res.setHeader('cache-control', 'max-age=3600');
    send(res, 200, events);
  });
};