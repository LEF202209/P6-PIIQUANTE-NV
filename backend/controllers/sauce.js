const Sauce = require('../models/Sauce');


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce)
    delete sauceObject._id;
    //ajout des informations du formulaire a partir du model sauce
    const sauce = new Sauce({
      ...sauceObject,
      
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      likes: '0',
      dislikes: '0',
	  usersLiked: '[]',
  	  usersDisliked: '[]'
    })
    sauce.save()
      .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
      .catch(error => res.status(400).json({ error }))
  }
  