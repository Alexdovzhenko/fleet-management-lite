export interface FBOEntry {
  name: string       // FBO operator name
  airport: string    // Airport name
  icao: string       // ICAO code
  iata?: string      // IATA code
  city: string       // City
  state: string      // 2-letter state/province code
  address: string    // Full street address
  zip?: string       // ZIP/postal code
  country?: string   // "USA" or "Canada"
}

export const FBO_DATA: FBOEntry[] = [
  // South Florida
  { name: "Signature Aviation", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14100 NW 42nd Ave", zip: "33054", country: "USA" },
  { name: "Banyan Air Service", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14101 NW 42nd Ave", zip: "33054", country: "USA" },
  { name: "Atlantic Aviation", airport: "Opa-locka Executive Airport", icao: "KOPF", iata: "OPF", city: "Opa-locka", state: "FL", address: "14102 NW 42nd Ave", zip: "33054", country: "USA" },
  { name: "Signature Aviation", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2840 W State Road 84", zip: "33315", country: "USA" },
  { name: "Atlantic Aviation", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2841 W State Road 84", zip: "33315", country: "USA" },
  { name: "Million Air", airport: "Fort Lauderdale Executive Airport", icao: "KFXE", iata: "FXE", city: "Fort Lauderdale", state: "FL", address: "2842 W State Road 84", zip: "33315", country: "USA" },
  { name: "Signature Aviation", airport: "Boca Raton Airport", icao: "KBCT", iata: "BCT", city: "Boca Raton", state: "FL", address: "1200 Airport Road", zip: "33432", country: "USA" },
  { name: "Sheltair Aviation", airport: "Boca Raton Airport", icao: "KBCT", iata: "BCT", city: "Boca Raton", state: "FL", address: "1201 Airport Road", zip: "33432", country: "USA" },
  { name: "Tamiami Aviation", airport: "Tamiami Executive Airport", icao: "KTMB", iata: "TMB", city: "Miami", state: "FL", address: "1400 SW 60th Ave", zip: "33144", country: "USA" },
  { name: "Million Air", airport: "Tamiami Executive Airport", icao: "KTMB", iata: "TMB", city: "Miami", state: "FL", address: "1401 SW 60th Ave", zip: "33144", country: "USA" },
  { name: "Pompano Beach Airpark FBO", airport: "Pompano Beach Airpark", icao: "KPMP", iata: "PMP", city: "Pompano Beach", state: "FL", address: "1200 N Military Trail", zip: "33064", country: "USA" },
  { name: "Banyan Air Service", airport: "Pompano Beach Airpark", icao: "KPMP", iata: "PMP", city: "Pompano Beach", state: "FL", address: "1201 N Military Trail", zip: "33064", country: "USA" },
  { name: "Royal Palm Aviation", airport: "Palm Beach International Airport", icao: "KPBI", iata: "PBI", city: "West Palm Beach", state: "FL", address: "3001 Spudnik Drive", zip: "33406", country: "USA" },
  { name: "Signature Aviation", airport: "Palm Beach International Airport", icao: "KPBI", iata: "PBI", city: "West Palm Beach", state: "FL", address: "3002 Spudnik Drive", zip: "33406", country: "USA" },
  { name: "Lantana Airport FBO", airport: "Lantana Airport", icao: "KLNA", iata: "LNA", city: "Lantana", state: "FL", address: "560 N Town Road", zip: "33462", country: "USA" },

  // New York Metro
  { name: "Signature Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "100 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Million Air", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "101 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Atlantic Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "102 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Jet Aviation", airport: "Teterboro Airport", icao: "KTEB", iata: "TEB", city: "Teterboro", state: "NJ", address: "103 Fred Wehran Drive", zip: "07608", country: "USA" },
  { name: "Signature Aviation", airport: "Westchester County Airport", icao: "KHPN", iata: "HPN", city: "White Plains", state: "NY", address: "240 North Avenue", zip: "10604", country: "USA" },
  { name: "Mamaroneck Aviation Fuel", airport: "Westchester County Airport", icao: "KHPN", iata: "HPN", city: "White Plains", state: "NY", address: "241 North Avenue", zip: "10604", country: "USA" },
  { name: "Signature Aviation", airport: "Republic Airport", icao: "KFRG", iata: "FRG", city: "Farmingdale", state: "NY", address: "One Airpark Road", zip: "11735", country: "USA" },
  { name: "Majestic Aviation", airport: "Republic Airport", icao: "KFRG", iata: "FRG", city: "Farmingdale", state: "NY", address: "Two Airpark Road", zip: "11735", country: "USA" },

  // Los Angeles
  { name: "Signature Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7200 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Atlantic Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7201 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Million Air", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7202 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Shell Aviation", airport: "Van Nuys Airport", icao: "KVNY", iata: "VNY", city: "Van Nuys", state: "CA", address: "7203 N Hayvenhurst Ave", zip: "91406", country: "USA" },
  { name: "Signature Aviation", airport: "Burbank Airport", icao: "KBUR", iata: "BUR", city: "Burbank", state: "CA", address: "2806 N Magnolia Blvd", zip: "91504", country: "USA" },
  { name: "Sheltair Aviation", airport: "Burbank Airport", icao: "KBUR", iata: "BUR", city: "Burbank", state: "CA", address: "2807 N Magnolia Blvd", zip: "91504", country: "USA" },
  { name: "Signature Aviation", airport: "Long Beach Airport", icao: "KLGB", iata: "LGB", city: "Long Beach", state: "CA", address: "2799 E South Street", zip: "90810", country: "USA" },
  { name: "Atlantic Aviation", airport: "Long Beach Airport", icao: "KLGB", iata: "LGB", city: "Long Beach", state: "CA", address: "2800 E South Street", zip: "90810", country: "USA" },
  { name: "Whiteman Airport FBO", airport: "Whiteman Airport", icao: "KWHP", iata: "WHP", city: "Pacoima", state: "CA", address: "12653 N Whiteman Street", zip: "91331", country: "USA" },
  { name: "El Monte Airport FBO", airport: "El Monte Airport", icao: "KEMT", iata: "EMT", city: "El Monte", state: "CA", address: "4770 N Santa Anita Ave", zip: "91731", country: "USA" },

  // Dallas/Fort Worth
  { name: "Signature Aviation", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14001 Lakeside Drive", zip: "75254", country: "USA" },
  { name: "Atlantic Aviation", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14002 Lakeside Drive", zip: "75254", country: "USA" },
  { name: "Million Air", airport: "Dallas Addison Airport", icao: "KADS", iata: "ADS", city: "Dallas", state: "TX", address: "14003 Lakeside Drive", zip: "75254", country: "USA" },
  { name: "Alliance Aviation", airport: "Alliance Fort Worth Airport", icao: "KAFW", iata: "AFW", city: "Fort Worth", state: "TX", address: "4050 Alliance Gateway Frwy", zip: "76177", country: "USA" },
  { name: "Signature Aviation", airport: "Alliance Fort Worth Airport", icao: "KAFW", iata: "AFW", city: "Fort Worth", state: "TX", address: "4051 Alliance Gateway Frwy", zip: "76177", country: "USA" },

  // Houston
  { name: "Shell Aviation", airport: "Houston Hobby Executive", icao: "KHOU", iata: "HOU", city: "Houston", state: "TX", address: "7800 Airline Drive", zip: "77037", country: "USA" },
  { name: "Signature Aviation", airport: "Sugar Land Regional Airport", icao: "KSGR", iata: "SGR", city: "Sugar Land", state: "TX", address: "350 Airport Road", zip: "77478", country: "USA" },
  { name: "Galaxy Aviation", airport: "Sugar Land Regional Airport", icao: "KSGR", iata: "SGR", city: "Sugar Land", state: "TX", address: "351 Airport Road", zip: "77478", country: "USA" },

  // Las Vegas
  { name: "Signature Aviation", airport: "Henderson Executive Airport", icao: "KHND", iata: "HND", city: "Henderson", state: "NV", address: "702 Executive Drive", zip: "89002", country: "USA" },
  { name: "Atlantic Aviation", airport: "Henderson Executive Airport", icao: "KHND", iata: "HND", city: "Henderson", state: "NV", address: "703 Executive Drive", zip: "89002", country: "USA" },
  { name: "North Las Vegas Flight Center", airport: "North Las Vegas Airport", icao: "KVGT", iata: "VGT", city: "North Las Vegas", state: "NV", address: "2730 North Pecos Road", zip: "89030", country: "USA" },

  // Phoenix/Scottsdale
  { name: "Signature Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15003 N Airport Drive", zip: "85260", country: "USA" },
  { name: "Jet Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15004 N Airport Drive", zip: "85260", country: "USA" },
  { name: "Atlantic Aviation", airport: "Scottsdale Airport", icao: "KSDL", iata: "SDL", city: "Scottsdale", state: "AZ", address: "15005 N Airport Drive", zip: "85260", country: "USA" },
  { name: "Phoenix Deer Valley Aviation", airport: "Phoenix Deer Valley Airport", icao: "KDVT", iata: "DVT", city: "Phoenix", state: "AZ", address: "702 E Deer Valley Drive", zip: "85024", country: "USA" },

  // Atlanta
  { name: "Signature Aviation", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2000 Robertson Avenue", zip: "30341", country: "USA" },
  { name: "Atlantic Aviation", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2001 Robertson Avenue", zip: "30341", country: "USA" },
  { name: "Million Air", airport: "DeKalb-Peachtree Airport", icao: "KPDK", iata: "PDK", city: "Atlanta", state: "GA", address: "2002 Robertson Avenue", zip: "30341", country: "USA" },
  { name: "Fulton County Airport FBO", airport: "Fulton County Airport", icao: "KFTY", iata: "FTY", city: "College Park", state: "GA", address: "3950 Aviation Avenue", zip: "30337", country: "USA" },

  // Nashville
  { name: "Tennessee Air", airport: "John C Tune Airport", icao: "KJWN", iata: "JWN", city: "Nashville", state: "TN", address: "8600 Dickerson Pike", zip: "37214", country: "USA" },
  { name: "Signature Aviation", airport: "Nashville International Airport", icao: "KBNA", iata: "BNA", city: "Nashville", state: "TN", address: "2500 Gen Tyas Boulevard", zip: "37214", country: "USA" },

  // DC Metro
  { name: "Hangar One Flight Center", airport: "Harpers Ferry Airport", icao: "KHEF", iata: "HEF", city: "Martinsburg", state: "WV", address: "1800 Aviation Road", zip: "25404", country: "USA" },
  { name: "Washington Dulles Business Aviation Center", airport: "Washington Dulles International", icao: "KIAD", iata: "IAD", city: "Herndon", state: "VA", address: "44420 Aviation Drive", zip: "20166", country: "USA" },

  // San Francisco Bay
  { name: "Signature Aviation", airport: "San Jose Airport", icao: "KSJC", iata: "SJC", city: "San Jose", state: "CA", address: "2881 North First Street", zip: "95134", country: "USA" },
  { name: "Bay Flight Services", airport: "Palo Alto Airport", icao: "KPAO", iata: "PAO", city: "Palo Alto", state: "CA", address: "1925 N California Ave", zip: "94303", country: "USA" },
  { name: "Hayward Executive Airport FBO", airport: "Hayward Executive Airport", icao: "KHWD", iata: "HWD", city: "Hayward", state: "CA", address: "20400 Skywest Drive", zip: "94541", country: "USA" },

  // Seattle
  { name: "Signature Aviation", airport: "Seattle-Tacoma International", icao: "KSEA", iata: "SEA", city: "SeaTac", state: "WA", address: "16110 International Blvd", zip: "98158", country: "USA" },
  { name: "Paine Field Business Aviation", airport: "Paine Field", icao: "KPAE", iata: "PAE", city: "Everett", state: "WA", address: "11900 NW Airport Drive", zip: "98204", country: "USA" },
  { name: "Boeing Field FBO", airport: "Boeing Field", icao: "KBFI", iata: "BFI", city: "Seattle", state: "WA", address: "8050 E Marginal Way S", zip: "98134", country: "USA" },

  // Denver
  { name: "Signature Aviation", airport: "Rocky Mountain Metro Airport", icao: "KBJC", iata: "BJC", city: "Broomfield", state: "CO", address: "11755 N Airport Road", zip: "80021", country: "USA" },
  { name: "Rocky Mountain Air Center", airport: "Rocky Mountain Metro Airport", icao: "KBJC", iata: "BJC", city: "Broomfield", state: "CO", address: "11756 N Airport Road", zip: "80021", country: "USA" },

  // Boston
  { name: "Signature Aviation", airport: "Boston Executive Airport", icao: "KBED", iata: "BED", city: "Bedford", state: "MA", address: "220 Great Road", zip: "01730", country: "USA" },
  { name: "Massport Aviation", airport: "Logan International Airport", icao: "KBOS", iata: "BOS", city: "Boston", state: "MA", address: "East Boston", zip: "02128", country: "USA" },

  // Chicago
  { name: "Signature Aviation", airport: "DuPage Airport", icao: "KDPA", iata: "DPA", city: "West Chicago", state: "IL", address: "7200 LeaAnn Drive", zip: "60185", country: "USA" },
  { name: "Million Air", airport: "DuPage Airport", icao: "KDPA", iata: "DPA", city: "West Chicago", state: "IL", address: "7201 LeaAnn Drive", zip: "60185", country: "USA" },
  { name: "Palwaukee Aviation FBO", airport: "Palwaukee Municipal Airport", icao: "KPWK", iata: "PWK", city: "Wheeling", state: "IL", address: "1020 South Milwaukee Avenue", zip: "60090", country: "USA" },

  // Orlando
  { name: "Signature Aviation", airport: "Orlando Executive Airport", icao: "KORL", iata: "ORL", city: "Orlando", state: "FL", address: "415 Herndon Avenue", zip: "32803", country: "USA" },
  { name: "Million Air", airport: "Sanford International Airport", icao: "KSFB", iata: "SFB", city: "Sanford", state: "FL", address: "1001 Ryw Williams Avenue", zip: "32773", country: "USA" },

  // Tampa
  { name: "Signature Aviation", airport: "Peter O Knight Airport", icao: "KVDF", iata: "VDF", city: "Tampa", state: "FL", address: "3500 Admiral Halsey Avenue", zip: "33619", country: "USA" },
  { name: "Tampa International FBO", airport: "Tampa International Airport", icao: "KTPA", iata: "TPA", city: "Tampa", state: "FL", address: "4100 Shortcut Road", zip: "33622", country: "USA" },

  // San Diego
  { name: "Atlantic Aviation", airport: "Montgomery Field", icao: "KMYF", iata: "MYF", city: "San Diego", state: "CA", address: "5480 Kearny Villa Road", zip: "92123", country: "USA" },
  { name: "San Diego Flight Center", airport: "San Diego International Airport", icao: "KSAN", iata: "SAN", city: "San Diego", state: "CA", address: "3707 North Harbor Drive", zip: "92101", country: "USA" },

  // Minneapolis
  { name: "Atlantic Aviation", airport: "Anoka County Airport", icao: "KANE", iata: "ANE", city: "Anoka", state: "MN", address: "2800 North Road", zip: "55303", country: "USA" },
  { name: "Signature Aviation", airport: "Minneapolis-St Paul International", icao: "KMSP", iata: "MSP", city: "Bloomington", state: "MN", address: "4300 Glumack Drive", zip: "55111", country: "USA" },

  // Detroit
  { name: "Pontiac Aviation", airport: "Oakland County International", icao: "KPTK", iata: "PTK", city: "Pontiac", state: "MI", address: "6500 Lapeer Road", zip: "48340", country: "USA" },
  { name: "Detroit City Aviation", airport: "Coleman Young International", icao: "KDET", iata: "DET", city: "Detroit", state: "MI", address: "801 East Jefferson Avenue", zip: "48226", country: "USA" },

  // Cleveland
  { name: "Burke Lakefront Airport FBO", airport: "Burke Lakefront Airport", icao: "KBKL", iata: "BKL", city: "Cleveland", state: "OH", address: "1501 North Marginal Road", zip: "44114", country: "USA" },

  // Pittsburgh
  { name: "Allegheny County Airport FBO", airport: "Allegheny County Airport", icao: "KAGC", iata: "AGC", city: "West Mifflin", state: "PA", address: "1008 Findley Road", zip: "15122", country: "USA" },

  // Kansas City
  { name: "Gravois Mills Aviation", airport: "Kansas City International", icao: "KMCI", iata: "MCI", city: "Kansas City", state: "MO", address: "2300 North Cargo Road", zip: "64150", country: "USA" },

  // St. Louis
  { name: "Bi State Development FBO", airport: "St. Louis Lambert International", icao: "KSTL", iata: "STL", city: "St. Louis", state: "MO", address: "10701 Lambert Plum Road", zip: "63145", country: "USA" },

  // New Orleans
  { name: "New Orleans Lakefront Airport FBO", airport: "New Orleans Lakefront Airport", icao: "KNEW", iata: "NEW", city: "New Orleans", state: "LA", address: "6001 Stars and Stripes Blvd", zip: "70126", country: "USA" },

  // Salt Lake City
  { name: "Signature Aviation", airport: "Salt Lake City International", icao: "KSLC", iata: "SLC", city: "Salt Lake City", state: "UT", address: "2601 S West Temple", zip: "84115", country: "USA" },

  // Albuquerque
  { name: "Atlantic Aviation", airport: "Albuquerque International", icao: "KABQ", iata: "ABQ", city: "Albuquerque", state: "NM", address: "2200 Sunport Boulevard", zip: "87106", country: "USA" },

  // Austin
  { name: "Signature Aviation", airport: "Austin-Bergstrom International", icao: "KAUS", iata: "AUS", city: "Austin", state: "TX", address: "3600 Presidential Blvd", zip: "78719", country: "USA" },

  // San Antonio
  { name: "Hector Garcia San Antonio International", airport: "San Antonio International", icao: "KSAT", iata: "SAT", city: "San Antonio", state: "TX", address: "9800 Airport Blvd", zip: "78216", country: "USA" },

  // Sacramento
  { name: "Metropolitan Air", airport: "Sacramento International", icao: "KMHR", iata: "MHR", city: "Rancho Cordova", state: "CA", address: "6001 Freeport Boulevard", zip: "95670", country: "USA" },

  // Portland, Oregon
  { name: "Signature Aviation", airport: "Portland Hillsboro Airport", icao: "KHIO", iata: "HIO", city: "Hillsboro", state: "OR", address: "3355 NE Cornell Road", zip: "97124", country: "USA" },

  // Raleigh
  { name: "RDU Aviation", airport: "Raleigh-Durham International", icao: "KRDU", iata: "RDU", city: "Raleigh", state: "NC", address: "2600 Aerial Center Parkway", zip: "27604", country: "USA" },

  // Columbus
  { name: "Columbus Air", airport: "Don Scott Airport", icao: "KOSU", iata: "OSU", city: "Columbus", state: "OH", address: "2780 W Case Road", zip: "43235", country: "USA" },

  // CANADA
  // Toronto
  { name: "Signature Aviation", airport: "Toronto Pearson International", icao: "CYYZ", iata: "YYZ", city: "Toronto", state: "ON", address: "675 Silver Dart Drive", zip: "M1V 3A7", country: "Canada" },
  { name: "Canadian Flight Centre", airport: "Waterloo Regional Airport", icao: "CYKF", iata: "YKF", city: "Waterloo", state: "ON", address: "235 Wilmot Avenue", zip: "N2J 4Y4", country: "Canada" },
  { name: "Hamilton Aircraft Services", airport: "Hamilton International Airport", icao: "CYHM", iata: "YHM", city: "Hamilton", state: "ON", address: "9400 Aerodrome Road", zip: "L0R 1W0", country: "Canada" },

  // Vancouver
  { name: "Vancouver Flight Centre", airport: "Vancouver International", icao: "CYVR", iata: "YVR", city: "Richmond", state: "BC", address: "3440 Cessna Drive", zip: "V7B 1V5", country: "Canada" },
  { name: "Boundary Bay Aviation", airport: "Boundary Bay Airport", icao: "CZBB", iata: "ZBB", city: "Delta", state: "BC", address: "9080 120th Street", zip: "V4E 2A1", country: "Canada" },

  // Calgary
  { name: "Signature Aviation", airport: "Calgary International", icao: "CYYC", iata: "YYC", city: "Calgary", state: "AB", address: "2000 Airport Road NE", zip: "T2E 6Z8", country: "Canada" },
  { name: "Jet Aviation", airport: "Calgary International", icao: "CYYC", iata: "YYC", city: "Calgary", state: "AB", address: "2001 Airport Road NE", zip: "T2E 6Z8", country: "Canada" },

  // Montreal
  { name: "Montreal Aviation Services", airport: "Saint-Hubert Airport", icao: "CYHU", iata: "YHU", city: "Saint-Hubert", state: "QC", address: "6500 Côte-de-Liesse", zip: "H4T 1H1", country: "Canada" },

  // Ottawa
  { name: "Ottawa Aviation", airport: "Ottawa Macdonald-Cartier International", icao: "CYOW", iata: "YOW", city: "Nepean", state: "ON", address: "1000 Airport Parkway", zip: "K1V 9B4", country: "Canada" },

  // Edmonton
  { name: "Cooking Lake Aerodrome", airport: "Cooking Lake Aerodrome", icao: "CYHY", iata: "YHY", city: "Legal", state: "AB", address: "51106 Range Road 265", zip: "T5N 6J5", country: "Canada" },

  // Winnipeg
  { name: "Winnipeg Flight Services", airport: "Winnipeg James Armstrong Richardson International", icao: "CYWG", iata: "YWG", city: "Winnipeg", state: "MB", address: "45 Perimeter Road", zip: "R3H 0A8", country: "Canada" },
]
