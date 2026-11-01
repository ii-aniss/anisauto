'use strict';

// [model, category, base price (USD), fuel]
module.exports = [
  {
    name: 'Toyota', country: 'Japan', color: '#EB0A1E', tagline: "Let's Go Places",
    models: [
      ['Corolla', 'Sedan', 22900], ['Camry', 'Sedan', 29500, 'Hybrid'], ['RAV4', 'SUV', 30500, 'Hybrid'],
      ['Highlander', 'SUV', 41500, 'Hybrid'], ['Tacoma', 'Pickup', 33500], ['Supra', 'Sports', 57500],
      ['Land Cruiser', 'SUV', 58500], ['Prius', 'Hatchback', 28900, 'Hybrid'], ['bZ4X', 'SUV', 44000, 'Electric']
    ]
  },
  {
    name: 'Honda', country: 'Japan', color: '#E60012', tagline: 'The Power of Dreams',
    models: [
      ['Civic', 'Sedan', 24500], ['Accord', 'Sedan', 29900], ['CR-V', 'SUV', 31500], ['Pilot', 'SUV', 41500],
      ['HR-V', 'SUV', 25500], ['Ridgeline', 'Pickup', 41500], ['Odyssey', 'Van', 39500]
    ]
  },
  {
    name: 'Nissan', country: 'Japan', color: '#C3002F', tagline: 'Innovation That Excites',
    models: [
      ['Altima', 'Sedan', 26500], ['Sentra', 'Sedan', 21500], ['Rogue', 'SUV', 29500], ['Pathfinder', 'SUV', 38500],
      ['Frontier', 'Pickup', 31500], ['Z', 'Sports', 43000], ['Ariya', 'SUV', 40500, 'Electric']
    ]
  },
  {
    name: 'Mazda', country: 'Japan', color: '#910A2D', tagline: 'Zoom-Zoom',
    models: [
      ['Mazda3', 'Hatchback', 24900], ['CX-30', 'SUV', 25900], ['CX-5', 'SUV', 29900], ['CX-50', 'SUV', 31900],
      ['CX-90', 'SUV', 40500], ['MX-5 Miata', 'Sports', 29900]
    ]
  },
  {
    name: 'Lexus', country: 'Japan', color: '#9B9B9B', tagline: 'Experience Amazing',
    models: [
      ['IS', 'Sedan', 42500], ['ES', 'Sedan', 43900, 'Hybrid'], ['RX', 'SUV', 50500, 'Hybrid'], ['NX', 'SUV', 41500],
      ['GX', 'SUV', 64500], ['LX', 'SUV', 92500], ['LC', 'Coupe', 98500]
    ]
  },
  {
    name: 'BMW', country: 'Germany', color: '#0066B1', tagline: 'The Ultimate Driving Machine',
    models: [
      ['3 Series', 'Sedan', 45900], ['5 Series', 'Sedan', 58900], ['7 Series', 'Sedan', 96500], ['X3', 'SUV', 49500],
      ['X5', 'SUV', 68500], ['X7', 'SUV', 82500], ['M3', 'Sports', 76500], ['i4', 'Sedan', 53500, 'Electric'],
      ['iX', 'SUV', 87500, 'Electric']
    ]
  },
  {
    name: 'Mercedes-Benz', country: 'Germany', color: '#C8CDD0', tagline: 'The Best or Nothing',
    models: [
      ['C-Class', 'Sedan', 47500], ['E-Class', 'Sedan', 62500], ['S-Class', 'Sedan', 118500], ['GLC', 'SUV', 48500],
      ['GLE', 'SUV', 63500], ['GLS', 'SUV', 87500], ['A-Class', 'Sedan', 35500], ['AMG GT', 'Coupe', 172000],
      ['EQS Sedan', 'Sedan', 105000, 'Electric'], ['EQE SUV', 'SUV', 78500, 'Electric']
    ]
  },
  {
    name: 'Audi', country: 'Germany', color: '#BB0A30', tagline: 'Vorsprung durch Technik',
    models: [
      ['A3', 'Sedan', 36500], ['A4', 'Sedan', 42500], ['A6', 'Sedan', 58500], ['A8', 'Sedan', 90500],
      ['Q3', 'SUV', 38500], ['Q5', 'SUV', 50500], ['Q7', 'SUV', 61500], ['Q8', 'SUV', 75500],
      ['e-tron GT', 'Sports', 107000, 'Electric'], ['Q6 e-tron', 'SUV', 65000, 'Electric']
    ]
  },
  {
    name: 'Porsche', country: 'Germany', color: '#B12B28', tagline: 'There Is No Substitute',
    models: [
      ['911', 'Sports', 122000], ['Cayenne', 'SUV', 80500], ['Macan', 'SUV', 62500], ['Panamera', 'Sedan', 101000],
      ['Taycan', 'Sedan', 92500, 'Electric'], ['718 Cayman', 'Sports', 69500]
    ]
  },
  {
    name: 'Volkswagen', country: 'Germany', color: '#001E50', tagline: 'Das Auto',
    models: [
      ['Golf GTI', 'Hatchback', 32500], ['Jetta', 'Sedan', 22500], ['Tiguan', 'SUV', 29500], ['Atlas', 'SUV', 38500],
      ['ID.4', 'SUV', 40500, 'Electric'], ['Taos', 'SUV', 24500], ['ID. Buzz', 'Van', 61000, 'Electric']
    ]
  },
  {
    name: 'Ferrari', country: 'Italy', color: '#FF2800', tagline: 'Race-bred. Road-ready.',
    models: [
      ['Roma', 'Coupe', 247000], ['SF90 Stradale', 'Sports', 525000], ['296 GTB', 'Sports', 345000],
      ['Purosangue', 'SUV', 405000], ['812 GTS', 'Convertible', 435000]
    ]
  },
  {
    name: 'Lamborghini', country: 'Italy', color: '#DDB321', tagline: 'Expect the Unexpected',
    models: [
      ['Huracan', 'Sports', 218000], ['Urus', 'SUV', 242000], ['Revuelto', 'Sports', 615000], ['Temerario', 'Sports', 365000]
    ]
  },
  {
    name: 'Maserati', country: 'Italy', color: '#0C2340', tagline: 'Luxury, Italian Style',
    models: [
      ['Ghibli', 'Sedan', 85500], ['Levante', 'SUV', 101000], ['Grecale', 'SUV', 75500], ['GranTurismo', 'Coupe', 178000],
      ['MC20', 'Sports', 245000]
    ]
  },
  {
    name: 'Alfa Romeo', country: 'Italy', color: '#B01E2E', tagline: 'La Meccanica delle Emozioni',
    models: [
      ['Giulia', 'Sedan', 45500], ['Stelvio', 'SUV', 48500], ['Tonale', 'SUV', 45500, 'Hybrid'], ['Junior', 'SUV', 32500]
    ]
  },
  {
    name: 'Ford', country: 'USA', color: '#00274E', tagline: 'Built Ford Tough',
    models: [
      ['Mustang', 'Sports', 32500], ['F-150', 'Pickup', 38500], ['Explorer', 'SUV', 40500], ['Escape', 'SUV', 30500],
      ['Bronco', 'SUV', 40500], ['Ranger', 'Pickup', 33500], ['Expedition', 'SUV', 63500],
      ['Mustang Mach-E', 'SUV', 43500, 'Electric'], ['F-150 Lightning', 'Pickup', 55500, 'Electric']
    ]
  },
  {
    name: 'Chevrolet', country: 'USA', color: '#D1AB66', tagline: 'Find New Roads',
    models: [
      ['Corvette', 'Sports', 68500], ['Silverado 1500', 'Pickup', 38500], ['Tahoe', 'SUV', 57500], ['Equinox', 'SUV', 28500],
      ['Traverse', 'SUV', 38500], ['Camaro', 'Sports', 30500], ['Blazer EV', 'SUV', 45500, 'Electric'],
      ['Bolt EUV', 'Hatchback', 28500, 'Electric']
    ]
  },
  {
    name: 'Tesla', country: 'USA', color: '#CC0000', tagline: 'Accelerating the Future',
    models: [
      ['Model 3', 'Sedan', 40500, 'Electric'], ['Model Y', 'SUV', 45500, 'Electric'], ['Model S', 'Sedan', 80500, 'Electric'],
      ['Model X', 'SUV', 90500, 'Electric'], ['Cybertruck', 'Pickup', 80500, 'Electric']
    ]
  },
  {
    name: 'Jeep', country: 'USA', color: '#4B6F44', tagline: 'Go Anywhere. Do Anything.',
    models: [
      ['Wrangler', 'SUV', 35500], ['Grand Cherokee', 'SUV', 42500], ['Cherokee', 'SUV', 37500], ['Gladiator', 'Pickup', 40500],
      ['Compass', 'SUV', 28500], ['Wagoneer', 'SUV', 63500]
    ]
  },
  {
    name: 'Cadillac', country: 'USA', color: '#941A1D', tagline: 'Standard of the World',
    models: [
      ['CT4', 'Sedan', 35500], ['CT5', 'Sedan', 40500], ['Escalade', 'SUV', 85500], ['XT5', 'SUV', 45500],
      ['Lyriq', 'SUV', 60500, 'Electric'], ['Celestiq', 'Sedan', 340000, 'Electric']
    ]
  },
  {
    name: 'Dodge', country: 'USA', color: '#A6192E', tagline: 'Domestic. Not Domesticated.',
    models: [
      ['Charger', 'Sedan', 35500], ['Challenger', 'Coupe', 34500], ['Durango', 'SUV', 40500], ['Hornet', 'SUV', 32500]
    ]
  },
  {
    name: 'Hyundai', country: 'South Korea', color: '#002C5F', tagline: 'Progress for Humanity',
    models: [
      ['Elantra', 'Sedan', 22500], ['Sonata', 'Sedan', 28500], ['Tucson', 'SUV', 28500], ['Santa Fe', 'SUV', 35500],
      ['Palisade', 'SUV', 38500], ['Ioniq 5', 'SUV', 45500, 'Electric'], ['Ioniq 6', 'Sedan', 43500, 'Electric']
    ]
  },
  {
    name: 'Kia', country: 'South Korea', color: '#05141F', tagline: 'Movement That Inspires',
    models: [
      ['K5', 'Sedan', 27500], ['Sportage', 'SUV', 28500], ['Sorento', 'SUV', 33500], ['Telluride', 'SUV', 37500],
      ['EV6', 'SUV', 43500, 'Electric'], ['EV9', 'SUV', 55500, 'Electric'], ['Carnival', 'Van', 35500]
    ]
  },
  {
    name: 'Genesis', country: 'South Korea', color: '#00274C', tagline: 'Athletic Elegance',
    models: [
      ['G70', 'Sedan', 42500], ['G80', 'Sedan', 58500], ['G90', 'Sedan', 90500], ['GV70', 'SUV', 46500],
      ['GV80', 'SUV', 59500], ['GV60', 'SUV', 52500, 'Electric']
    ]
  },
  {
    name: 'Volvo', country: 'Sweden', color: '#003057', tagline: 'Designed Around You',
    models: [
      ['S60', 'Sedan', 43500, 'Hybrid'], ['S90', 'Sedan', 58500, 'Hybrid'], ['XC40', 'SUV', 40500], ['XC60', 'SUV', 48500, 'Hybrid'],
      ['XC90', 'SUV', 58500, 'Hybrid'], ['EX30', 'SUV', 36500, 'Electric'], ['EX90', 'SUV', 80500, 'Electric']
    ]
  },
  {
    name: 'Land Rover', country: 'United Kingdom', color: '#005A2B', tagline: 'Above and Beyond',
    models: [
      ['Defender', 'SUV', 58500], ['Discovery', 'SUV', 62500], ['Range Rover', 'SUV', 108500], ['Range Rover Sport', 'SUV', 85500],
      ['Velar', 'SUV', 62500], ['Evoque', 'SUV', 50500]
    ]
  },
  {
    name: 'Jaguar', country: 'United Kingdom', color: '#9E1B32', tagline: 'The Art of Performance',
    models: [
      ['F-PACE', 'SUV', 58500], ['F-TYPE', 'Sports', 75500], ['I-PACE', 'SUV', 72500, 'Electric'], ['XF', 'Sedan', 48500]
    ]
  },
  {
    name: 'Bentley', country: 'United Kingdom', color: '#1C1C1C', tagline: 'Extraordinary Journeys',
    models: [
      ['Continental GT', 'Coupe', 247000], ['Flying Spur', 'Sedan', 212000], ['Bentayga', 'SUV', 207000]
    ]
  },
  {
    name: 'Rolls-Royce', country: 'United Kingdom', color: '#281432', tagline: 'Inspiring Greatness',
    models: [
      ['Phantom', 'Sedan', 505000], ['Ghost', 'Sedan', 355000], ['Cullinan', 'SUV', 405000], ['Spectre', 'Coupe', 425000, 'Electric']
    ]
  },
  {
    name: 'Aston Martin', country: 'United Kingdom', color: '#00594F', tagline: 'Power, Beauty, Soul',
    models: [
      ['Vantage', 'Sports', 198000], ['DB12', 'Coupe', 252000], ['DBX707', 'SUV', 252000], ['Vanquish', 'Sports', 435000]
    ]
  },
  {
    name: 'McLaren', country: 'United Kingdom', color: '#FF8000', tagline: 'Fearlessly Forward',
    models: [
      ['750S', 'Sports', 335000], ['Artura', 'Sports', 242000], ['GT', 'Coupe', 217000]
    ]
  },
  {
    name: 'MINI', country: 'United Kingdom', color: '#111111', tagline: 'Let’s Motor',
    models: [
      ['Cooper S', 'Hatchback', 32500], ['Countryman', 'SUV', 42500], ['Clubman', 'Hatchback', 35500], ['Convertible', 'Convertible', 38500]
    ]
  },
  {
    name: 'Subaru', country: 'Japan', color: '#013C74', tagline: 'Confidence in Motion',
    models: [
      ['Outback', 'Wagon', 30500], ['Forester', 'SUV', 28500], ['Crosstrek', 'SUV', 26500], ['WRX', 'Sedan', 34500],
      ['BRZ', 'Sports', 32500], ['Solterra', 'SUV', 45500, 'Electric']
    ]
  },
  {
    name: 'Mitsubishi', country: 'Japan', color: '#E60012', tagline: 'Drive Your Ambition',
    models: [
      ['Outlander', 'SUV', 29500], ['Eclipse Cross', 'SUV', 27500], ['Mirage', 'Hatchback', 18500],
      ['Outlander PHEV', 'SUV', 40500, 'Hybrid']
    ]
  },
  {
    name: 'RAM', country: 'USA', color: '#222222', tagline: 'Built to Serve',
    models: [
      ['1500', 'Pickup', 40500], ['2500', 'Pickup', 48500], ['1500 TRX', 'Pickup', 98500], ['ProMaster', 'Van', 42500]
    ]
  },
  {
    name: 'GMC', country: 'USA', color: '#CF102D', tagline: 'We Are Professional Grade',
    models: [
      ['Sierra 1500', 'Pickup', 42500], ['Yukon', 'SUV', 60500], ['Acadia', 'SUV', 40500], ['Hummer EV', 'Pickup', 98500, 'Electric'],
      ['Canyon', 'Pickup', 37500]
    ]
  },
  {
    name: 'Polestar', country: 'Sweden', color: '#0B0B0B', tagline: 'Pure. Progressive. Performance.',
    models: [
      ['Polestar 2', 'Sedan', 50500, 'Electric'], ['Polestar 3', 'SUV', 75500, 'Electric'], ['Polestar 4', 'SUV', 56500, 'Electric']
    ]
  },
  {
    name: 'Lucid', country: 'USA', color: '#2A2A2A', tagline: 'Post-Luxury Electric',
    models: [
      ['Air Pure', 'Sedan', 70500, 'Electric'], ['Air Touring', 'Sedan', 87500, 'Electric'],
      ['Air Grand Touring', 'Sedan', 110500, 'Electric'], ['Gravity', 'SUV', 95500, 'Electric']
    ]
  },
  {
    name: 'Rivian', country: 'USA', color: '#0A6C74', tagline: 'Keep the World Adventurous Forever',
    models: [
      ['R1T', 'Pickup', 70500, 'Electric'], ['R1S', 'SUV', 78500, 'Electric'], ['R2', 'SUV', 45500, 'Electric']
    ]
  },
  {
    name: 'BYD', country: 'China', color: '#E60012', tagline: 'Build Your Dreams',
    models: [
      ['Seal', 'Sedan', 35500, 'Electric'], ['Atto 3', 'SUV', 38500, 'Electric'], ['Han', 'Sedan', 45500, 'Electric'],
      ['Tang', 'SUV', 50500, 'Electric']
    ]
  },
  {
    name: 'Bugatti', country: 'France', color: '#1B4D8C', tagline: 'If It’s Comparable, It’s Not a Bugatti',
    models: [
      ['Chiron', 'Sports', 3300000], ['Tourbillon', 'Sports', 4100000]
    ]
  }
];
