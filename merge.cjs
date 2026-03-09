const fs = require('fs');
const turf = require('@turf/turf');

const data = JSON.parse(fs.readFileSync('public/vietnam.json'));

const merges = [
  { newName: 'Tỉnh Khánh Hòa', parts: ['Tỉnh Ninh Thuận', 'Tỉnh Khánh Hòa'] },
  { newName: 'Tỉnh Lâm Đồng', parts: ['Tỉnh Lâm Đồng', 'Tỉnh Đắk Nông', 'Tỉnh Bình Thuận'] },
  { newName: 'Tỉnh Đắk Lắk', parts: ['Tỉnh Đắk Lắk', 'Tỉnh Phú Yên'] },
  { newName: 'Thành phố Cần Thơ', parts: ['Thành phố Cần Thơ', 'Tỉnh Sóc Trăng', 'Tỉnh Hậu Giang'] },
  { newName: 'Tỉnh Vĩnh Long', parts: ['Tỉnh Vĩnh Long', 'Tỉnh Trà Vinh', 'Tỉnh Bến Tre'] },
  { newName: 'Tỉnh An Giang', parts: ['Tỉnh An Giang', 'Tỉnh Kiên Giang'] },
  { newName: 'Tỉnh Cà Mau', parts: ['Tỉnh Cà Mau', 'Tỉnh Bạc Liêu'] },
  { newName: 'Tỉnh Bắc Ninh', parts: ['Tỉnh Bắc Ninh', 'Tỉnh Bắc Giang'] },
  { newName: 'Tỉnh Thái Nguyên', parts: ['Tỉnh Thái Nguyên', 'Tỉnh Bắc Kạn'] },
  { newName: 'Tỉnh Phú Thọ', parts: ['Tỉnh Phú Thọ', 'Tỉnh Vĩnh Phúc', 'Tỉnh Hoà Bình'] },
  { newName: 'Tỉnh Lào Cai', parts: ['Tỉnh Lào Cai', 'Tỉnh Yên Bái'] }
];

let features = data.features;

for (const merge of merges) {
  const parts = features.filter(f => merge.parts.includes(f.properties.Ten));
  if (parts.length > 0) {
    let unioned = parts[0];
    for (let i = 1; i < parts.length; i++) {
        try {
            unioned = turf.union(turf.featureCollection([unioned, parts[i]]));
        } catch (e) {
            console.error('Error unioning', merge.newName, e);
        }
    }
    unioned.properties = { Ten: merge.newName };
    
    // Remove old parts
    features = features.filter(f => !merge.parts.includes(f.properties.Ten));
    // Add new unioned part
    features.push(unioned);
  }
}

data.features = features;

fs.writeFileSync('public/vietnam-merged.json', JSON.stringify(data));
console.log('Merged successfully. New province count:', features.length);
