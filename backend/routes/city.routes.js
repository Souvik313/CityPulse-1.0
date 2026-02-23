import { Router } from "express";
import { getAllCities , getCityByName , createNewCity , deleteCity , deleteAllCities } from "../controllers/city.controller.js";

const cityRouter = Router();

cityRouter.post("/" , createNewCity);
cityRouter.get("/" , getAllCities);
cityRouter.get("/search" , getCityByName);
cityRouter.delete("/:id" , deleteCity);
cityRouter.delete("/" , deleteAllCities);
export default cityRouter;