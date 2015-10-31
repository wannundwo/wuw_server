'use strict';

// import the express router
var router = require('express').Router();

// route /news
router.route('/')

    // GET
    .get(function(req, res) {

        var printers = [
            {
                "Raum": "1/014",
                "Modell": "HP LaserJet 9050",
                "Druckername": "HPLJ9050dtn_1_014",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/021",
                "Modell": "HP LaserJet 9040",
                "Druckername": "HPLJ9040_2_021N",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/103",
                "Modell": "HP LaserJet 4250",
                "Druckername": "HPLJ4250_2_103",
                "Format": "A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/114",
                "Modell": "HP LaserJet 4250",
                "Druckername": "HPLJ4250dtn_2_114",
                "Format": "A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/114",
                "Modell": "HP Color LaserJet 5550",
                "Druckername": "HPCLJ5550dn_2_114",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "ja"
            },
            {
                "Raum": "2/201",
                "Modell": "HP LaserJet 9040",
                "Druckername": "HPLJ9040DN_2_201",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/229",
                "Modell": "HP LaserJet 9050",
                "Druckername": "HPLJ9050_2_229",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/233",
                "Modell": "HP LaserJet 4250",
                "Druckername": "HPLJ4250_2_233",
                "Format": "A4",
                "Duplex": "ja",
                "Farbe": "nein"
            },
            {
                "Raum": "2/329",
                "Modell": "HP LaserJet 9040",
                "Druckername": "HPLJ9040_2_329",
                "Format": "A3, A4",
                "Duplex": "ja",
                "Farbe": "nein"
            }
        ]

        res.status(200).json(printers);
        res.end();

    });

module.exports = router;
