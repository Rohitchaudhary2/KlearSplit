import express from "express"

const app = express()

app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send(`hi there`)
})

app.listen(PORT, () => {
    `Server is listening on port ${PORT}`
})