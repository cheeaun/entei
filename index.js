require('dotenv').config();
const { send } = require('micro')
const got = require('got');
const spacetime = require('spacetime');

const dateFormat = 'y-MM-ddTHH:mm:ss';

// Only specialized for Singapore
const prettyAddress = ({ name = '', address_1 = '', address_2 = '', address_3 = '', city = '' }) => {
  const lowerName = name.toLowerCase();
  if (address_1.toLowerCase().includes(name) || address_2.toLowerCase().includes(name) || address_3.toLowerCase().includes(name)) name = '';
  let addr = [
    name.trim().replace(/\s+,/, ''),
    address_1.trim().replace(/\s+,/, ''),
    address_2.trim().replace(/\s+,/, ''),
    address_3.trim().replace(/\s+,/, ''),
  ].filter(Boolean).join(', ');
  if (city.trim() && !addr.toLowerCase().includes(city.toLowerCase())){
    addr += ', ' + city;
  }
  if (!/singapore/i.test(addr)){
    addr += ', Singapore';
  } else if (/\d{5,}$/.test(addr) && !/singapore\s+\d{5,}$/.test(addr)){ // postcode at the end
    addr += ' Singapore';
  }
  return addr;
};

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
          pretty_address: prettyAddress(venue),
        },
        group: group.name,
        link,
      };
    });

    res.setHeader('cache-control', 'max-age=3600');
    send(res, 200, events);
  });
};