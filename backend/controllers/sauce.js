const Sauce = require('../models/Sauce');
const fs= require('fs');
const xss= require('xss');
var messageMAJ='';


function createSauce (req, res) {
    let sauceObject = JSON.parse(req.body.sauce);
    // Ajout sécurité xss : Appel de la fonction escapeObject pour échapper les propriétés de type string
    sauceObject = escapeObject(sauceObject);

    delete sauceObject._id;
    delete sauceObject._userId;
    //ajout des informations du formulaire a partir du model sauce
    const sauce = new Sauce({
      ...sauceObject, 
      userId: req.auth.userId,
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
  
function getAllSauces  (req, res) {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.statut(400).json({ error }))
  }

  function getOneSauce   (req, res) {
    Sauce.findOne({ _id: req.params.id })
      .then(thing => res.status(200).json(thing))
      .catch(error => res.status(404).json({ error }));
  }

function modifySauce (req,res){
    // format objet transmis sous forme de chaîne de caractères
    // si téléchargement fichier
    let sauceObject = req.file? 
    {
        ...JSON.parse(req.body.sauce),
        imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    }:
    {...(req.body)};
    
    delete sauceObject._userId;
    Sauce.findOne ({_id:req.params.id})
    .then((sauce) =>{
        if (!sauce){
            res.status(404).json({message:'sauce inexistante!'})
        }
        else if (sauce.userId!==req.auth.userId) {
            res.status(403).json({message:'accès non autorisé!'})
        }
        else {
            // Ajout sécurité xss : Appel de la fonction escapeObject pour échapper les propriétés de type string
            sauceObject = escapeObject(sauceObject);

            // Mise à jour des données
            if (req.file) {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({_id:req.params.id},{...sauceObject,_id:req.params.id})
                .then(() => res.status(200).json({message:'Sauce modifiée!'}))
                .catch(error => res.status(400).json({error}))
                }) 
            }
            else {
                Sauce.updateOne({_id:req.params.id},{...sauceObject,_id:req.params.id})
                .then(() => res.status(200).json({message:'Sauce modifiée!'}))
                .catch(error => res.status(400).json({error}))
            }
        }
    })
    .catch(error => res.status(400).json({error}))
  }
 

function deleteSauce (req,res){
    Sauce.findOne ({_id:req.params.id})
    .then((sauce) =>{
        if (!sauce){
            res.status(404).json({message:'sauce inexistante!'})
        }
        else if (sauce.userId!==req.auth.userId) {
            res.status(403).json({message:'accès non autorisé!'})
        }
        else {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({_id:req.params.id})
            .then(() => res.status(200).json({message:'Sauce supprimée!'}))
            .catch(error => res.status(400).json({error}))
        }) 
    }})
}

function likeSauce (req,res){
    const userId = req.body.userId;
    const like = req.body.like;
    console.log('like'+like);
    Sauce.findOne ({_id:req.params.id})
    .then((sauce) =>{
        console.log('sauce'+sauce.name);
        if (!sauce){
            res.status(404).json({message:'sauce inexistante!'})
        }
        else {
            const userLiked = sauce.usersLiked.includes(userId);
            const userDisliked = sauce.usersDisliked.includes(userId);
            const update = {};
            switch (like) {
                // liker la sauce
                case 1 : {
                    if (!userLiked && !userDisliked) {
                        update.$inc = {likes:1};
                        update.$push ={usersLiked:userId};
                        messageMAJ='Like ajouté !'
                    }
                    else {
                        res.status(403).json({message:'Double vote interdit!'});
                    }
                }
                break;
                // disliker la sauce
                case -1 : {
                    if (!userLiked && !userDisliked) {
                        update.$inc = {dislikes:1};
                        update.$push ={usersDisliked:userId};
                        messageMAJ='Dislike ajouté !'
                    }
                    else {
                        res.status(403).json({message:'Double vote interdit!'});
                    }
                }
                break;
                // annuler son choix
                case 0 : {
                    if (userLiked) {
                        update.$inc = {likes:-1};
                        update.$pull ={usersLiked:userId};
                        messageMAJ='Like supprimé !'
                    }
                    else if (userDisliked) {
                        update.$inc = {dislikes:-1};
                        update.$pull ={usersDisliked:userId};
                        messageMAJ='Dislike supprimé !'
                    } else{
                        res.status(400).json({message:'Action invalide !'});   
                    }
                }
                break;
                // valeur like reçue invalide
                default:
                    res.status(400).json({message:`la valeur like ${like} n'est pas valide !`})
            }
            if (update.$pull || update.$push || update.$inc){
            Sauce.updateOne({_id:req.params.id},update)
            .then(() => {
                res.status(200).json({message:`$messageMAJ`})
            })
            .catch(error => res.status(400).json({error}))
            }
        }
    })
    .catch(error => res.status(400).json({error}))
  }

  // Sécurité xss : Échapper chaque propriété de sauceObject
  function escapeObject (sauceObj) {
  for (let key in sauceObj) {
    if (typeof sauceObj[key] === 'string') {
   sauceObj[key] = xss(sauceObj[key]);
   }}
   return sauceObj
}

module.exports =  {  createSauce, getAllSauces, getOneSauce, modifySauce, deleteSauce,likeSauce }
