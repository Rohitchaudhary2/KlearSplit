import express from "express"
import 'dotenv/config'
import sequelize from './config/db.connection.js'

const app = express()
app.use(express.json())
sequelize.sync()

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send(`hi there`)
})

app.post('/register', (req, res) => {

})

app.listen(PORT, () => {
    `Server is listening on port ${PORT}`
})