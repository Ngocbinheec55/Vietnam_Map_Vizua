const fs = require('fs');
const turf = require('@turf/turf');

const data = JSON.parse(fs.readFileSync('public/vietnam.json'));

const merges = [
  { newName: 'Thành phố Hồ Chí Minh', parts: ['Tỉnh Bình Dương', 'Thành phố Hồ Chí Minh', 'Tỉnh Bà Rịa - Vũng Tàu'] },
  { newName: 'Thành phố Hải Phòng', parts: ['Tỉnh Hải Dương', 'Thành phố Hải Phòng'] },
  { newName: 'Thành phố Đà Nẵng', parts: ['Tỉnh Quảng Nam', 'Thành phố Đà Nẵng'] },
  { newName: 'Thành phố Cần Thơ', parts: ['Tỉnh Sóc Trăng', 'Tỉnh Hậu Giang', 'Thành phố Cần Thơ'] },
  { newName: 'Tỉnh Tuyên Quang', parts: ['Tỉnh Hà Giang', 'Tỉnh Tuyên Quang'] },
  { newName: 'Tỉnh Lào Cai', parts: ['Tỉnh Lào Cai', 'Tỉnh Yên Bái'] },
  { newName: 'Tỉnh Thái Nguyên', parts: ['Tỉnh Bắc Kạn', 'Tỉnh Thái Nguyên'] },
  { newName: 'Tỉnh Phú Thọ', parts: ['Tỉnh Hoà Bình', 'Tỉnh Vĩnh Phúc', 'Tỉnh Phú Thọ'] },
  { newName: 'Tỉnh Bắc Ninh', parts: ['Tỉnh Bắc Giang', 'Tỉnh Bắc Ninh'] },
  { newName: 'Tỉnh Hưng Yên', parts: ['Tỉnh Thái Bình', 'Tỉnh Hưng Yên'] },
  { newName: 'Tỉnh Ninh Bình', parts: ['Tỉnh Hà Nam', 'Tỉnh Ninh Bình', 'Tỉnh Nam Định'] },
  { newName: 'Tỉnh Quảng Trị', parts: ['Tỉnh Quảng Bình', 'Tỉnh Quảng Trị'] },
  { newName: 'Tỉnh Quảng Ngãi', parts: ['Tỉnh Quảng Ngãi', 'Tỉnh Kon Tum'] },
  { newName: 'Tỉnh Gia Lai', parts: ['Tỉnh Gia Lai', 'Tỉnh Bình Định'] },
  { newName: 'Tỉnh Đắk Lắk', parts: ['Tỉnh Phú Yên', 'Tỉnh Đắk Lắk'] },
  { newName: 'Tỉnh Khánh Hòa', parts: ['Tỉnh Khánh Hòa', 'Tỉnh Ninh Thuận'] },
  { newName: 'Tỉnh Lâm Đồng', parts: ['Tỉnh Đắk Nông', 'Tỉnh Lâm Đồng', 'Tỉnh Bình Thuận'] },
  { newName: 'Tỉnh Đồng Nai', parts: ['Tỉnh Bình Phước', 'Tỉnh Đồng Nai'] },
  { newName: 'Tỉnh Tây Ninh', parts: ['Tỉnh Long An', 'Tỉnh Tây Ninh'] },
  { newName: 'Tỉnh Đồng Tháp', parts: ['Tỉnh Tiền Giang', 'Tỉnh Đồng Tháp'] },
  { newName: 'Tỉnh An Giang', parts: ['Tỉnh Kiên Giang', 'Tỉnh An Giang'] },
  { newName: 'Tỉnh Vĩnh Long', parts: ['Tỉnh Bến Tre', 'Tỉnh Vĩnh Long', 'Tỉnh Trà Vinh'] },
  { newName: 'Tỉnh Cà Mau', parts: ['Tỉnh Bạc Liêu', 'Tỉnh Cà Mau'] }
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

fs.writeFileSync('public/vietnam-merged2.json', JSON.stringify(data));
console.log('Merged successfully. New province count:', features.length);
