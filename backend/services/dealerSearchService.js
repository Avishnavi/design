const ScrapDealer = require('../models/ScrapDealer');

/**
 * Searches for scrap dealers using a combination of GPS and hierarchical location.
 * @param {Object} params { lat, lng, area, district, wasteType, limit }
 */
const searchDealers = async ({ lat, lng, area, district, wasteType, limit = 10 }) => {
  try {
    let dealers = [];
    const dealerIds = new Set();

    // 1. Try GPS Search (Nearest 20km)
    if (lat && lng) {
      try {
        const query = {
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              $maxDistance: 20000 // 20km
            }
          }
        };
        if (wasteType) {
          query.acceptedWasteTypes = { $in: [new RegExp(`^${wasteType}$`, 'i')] };
        }

        const gpsDealers = await ScrapDealer.find(query).limit(limit);
        gpsDealers.forEach(d => {
          dealers.push(d);
          dealerIds.add(d._id.toString());
        });
      } catch (err) {
        console.error('GPS Search Error:', err.message);
      }
    }

    // 2. Fallback/Combine with Area Match (if we still have space in limit)
    if (dealers.length < limit && area) {
      const query = { 
        area: new RegExp(`^${area}$`, 'i'),
        _id: { $nin: Array.from(dealerIds).map(id => (id)) }
      };
      if (wasteType) {
        query.acceptedWasteTypes = { $in: [new RegExp(`^${wasteType}$`, 'i')] };
      }

      const areaDealers = await ScrapDealer.find(query).limit(limit - dealers.length);
      areaDealers.forEach(d => {
        const dObj = d.toObject();
        dObj.matchType = 'Local Match';
        dealers.push(dObj);
        dealerIds.add(d._id.toString());
      });
    }

    // 3. Fallback/Combine with District Match
    if (dealers.length < limit && district) {
      const query = { 
        district: new RegExp(`^${district}$`, 'i'),
        _id: { $nin: Array.from(dealerIds).map(id => (id)) }
      };
      if (wasteType) {
        query.acceptedWasteTypes = { $in: [new RegExp(`^${wasteType}$`, 'i')] };
      }

      const districtDealers = await ScrapDealer.find(query).limit(limit - dealers.length);
      districtDealers.forEach(d => {
        const dObj = d.toObject();
        dObj.matchType = 'Regional Match';
        dealers.push(dObj);
        dealerIds.add(d._id.toString());
      });
    }

    // 4. Global Fallback for testing (if STILL nothing found and for specific wasteType)
    if (dealers.length === 0 && wasteType) {
        console.log(`[DEBUG] Final fallback for wasteType: ${wasteType}`);
        dealers = await ScrapDealer.find({ 
            acceptedWasteTypes: { $in: [new RegExp(`^${wasteType}$`, 'i')] } 
        }).limit(3);
    }

    return dealers;
  } catch (error) {
    console.error('Error in searchDealers service:', error);
    return [];
  }
};

module.exports = { searchDealers };
