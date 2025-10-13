
# ChainArt API

Documentation for handles features in chainArt


## Features

- User management
- Role Based Access Control
- Submit karya in blockchain
- List of data karya


## Tech Stack

**Server:** Node js, Express js, Ether js


## API Reference

#### Add profile

```
  POST api/profile 
```
Request
```json
{
    "walletAddress":"0xawjkajekljadadfs",
    "username" : "dolin",
    "contact": "dolin@gmail.com"
}
```
Response
```json
{
	"id": 1,
    "role":"USER",
    "createdAt:"ahfdsjkafd"
}
```

#### Update profile

```http
  PATCH api/profile/{id}
```
Request
```json
{
	"walletAddress":"0xawjkajekljadadfs"
    "username" : "dolin",
    "contact": "dolin@gmail.com"
}
```
Response
```json
{
	"walletAddress":"0xawjkajekljadadfs"
    "createdAt":"timestamp",
    "updateAt":"time stamp"
    "username" : "dolin",
    "contact": "dolin@gmail.com"
}
```


#### Get profile
```http
  GET /profile/{id}
```
Response
```json
{
  "id": 4,
  "walletAddress": "0xiqhwdoaasdA",
  "username": "EVAN",
  "contact": "evan@gmail.com",
  "createdAt": "2025-10-10T17:27:09.145Z",
  "role": "USER"
}
```

#### Get List of request creator
```http
  GET /profile/creator-request
```
Response
```json
{
  "id": 4,
  "walletAddress": "0xiqhwdoaasdA",
  "username": "EVAN",
  "contact": "evan@gmail.com",
  "createdAt": "2025-10-10T17:27:09.145Z",
  "role": "USER"
  "approveTocreator":false
}
```

#### Get List of creator
```http
  GET /profile/creator
```
Response
```json
{
  "id": 4,
  "walletAddress": "0xiqhwdoaasdA",
  "username": "EVAN",
  "contact": "evan@gmail.com",
  "createdAt": "2025-10-10T17:27:09.145Z",
  "role": "CREATOR"
  "approveTocreator":true
}
```

#### Submit karya

```http
  POST api/submit-karya
```
Request
```json
{  
    "role":"CREATOR",
    "creator":"evan",
    "address":"JL SOLO",       
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",   
    "authorId": 3, //ambil  dari id user
}
```
Response
```json
{
	"id": 1,
    "role":"CREATOR",
    "hak_cipta":"null",
    "licency":"null",
    "verified":false,
    "walletAddress":"0cdnsadsc",
    "creator":"evan",
    "status":"PENDING",
    "address":"JL SOLO",
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",
    "createdAt":"fdasafs",
    "updatesAt":"adfdfsa"     
}
```

#### Get karya by id

```http
  GET api/karya/{id}
```
Response
```json
{
	"id": 1,
    "role":"CREATOR",
    "hak_cipta":"null",
    "licency":"null",
    "verified":false,
    "walletAddress":"0cdnsadsc",
    "creator":"evan",
    "status":"PENDING",
    "address":"JL SOLO",
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",
    "createdAt":"fdasafs",
    "updatesAt":"adfdfsa"     
}
```

#### Get pending karya 

```http
  GET api/karya-pending
```
Response
```json
{
	"id": 1,
    "role":"CREATOR",
    "hak_cipta":"null",
    "licency":"null",
    "verified":false,
    "walletAddress":"0cdnsadsc",
    "creator":"evan",
    "status":"PENDING",
    "address":"JL SOLO",
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",
    "createdAt":"fdasafs",
    "updatesAt":"adfdfsa"     
}
```

#### approved karya by admin

```http
  POST api/karya/approved
```
Request
```json
{
    "idKarya":1,
}
```
Response
```json
{
	"id": 1,
    "updatesAt":"adfdfsa", 
    "hak_cipta":"asfdadf",
    "licency":"asdfdf",
    "verified":true,   
}
```

#### Get approved karya 

```http
  GET api/karya-approved
```
Response
```json
{
	"id": 1,
    "role":"CREATOR",
    "hak_cipta":"baskdfbadf",
    "licency":"abfdfadsa",
    "verified":true,
    "walletAddress":"0cdnsadsc",
    "creator":"evan",
    "status":"APPROVED",
    "address":"JL SOLO",
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",
    "createdAt":"fdasafs",
    "updatesAt":"adfdfsa"     
}
```

#### Search approved karya

```http
  GET api/karya/search
  make query contoh /api/karya/search?title=tes
```
Response
```json
{
	"id": 1,
    "role":"CREATOR",
    "hak_cipta":"baskdfbadf",
    "licency":"abfdfadsa",
    "verified":true,
    "walletAddress":"0cdnsadsc",
    "creator":"evan",
    "status":"APPROVED",
    "address":"JL SOLO",
    "media":"askjdfkjsa",    
    "title":"asdfa", 
    "category":"asdffd",  
    "description":"asasa",
    "makna":"sasasd",
    "createdAt":"fdasafs",
    "updatesAt":"adfdfsa"     
}
```






## Deployment


```bash
  https://chain-art.vercel.app/
```

