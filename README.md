# Infogroup - Vehicle
Inital prototype to match a trajectory of a truck from the AVL data from NYCDOT to the Infogroup dataset.   
A simple interface that can filter and visualize business points under NAICS code of 44, 45 and 72. Vehicle point referenced for query are the points for which the ignition of the truck are off.   

### Getting started:
```sh-session
$ git clone https://github.com/ng9891/infogroup-vehicle.git
$ cd infogroup-vehicle
$ npm i  
```
1. Move CSV file to `/public/dataset/data.csv` folder.
2. Start the server with: `npm start`.
3. Access the application by going to `http://localhost:3000/`

# Description
This application was develop using the powerful libary [dc-js](https://github.com/dc-js).

### Main Screen
![alt text](https://puu.sh/EQ6AD/5d599139ef.png "Main screen") 

### CSV Header
Current CSV file is the output of a query to the database:
```
- id: row number.
- CONAME: Company name.
- date: format YYYY-MM-DD.
- geopoint: GeoJSON of the geometry for the business point.
- PRMSTATE: State of the business.
- COUNTY: County of the business.
- NAICSCD: Full NAICS code.
- NAICSDS: Description of the full NAICS code.
- ALEMPSZ: Actual employment size.
```

Author: vT