const { AppDataSource } = require('../config/database');
const Event = require('../entities/Events/Event');
const logger = require('../utils/logger');

const eventRepository = AppDataSource.getRepository('Events');

exports.getAllEvent = async (req, res) => {
    try {
        const eventList = await eventRepository.find();
        logger.info(`Fetched ${eventList.length} events`);
        res.status(200).json(eventList);
    } catch (error) {
        logger.error(`Error fetching events: ${error.message}`);
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await eventRepository.findOneBy({ id: parseInt(id, 10) });

        if (!event) {
            logger.warn(`Event with ID ${id} not found`);
            return res.status(404).json({ message: 'Event not found' });
        }

        logger.info(`Fetched event with ID ${id}`);
        res.status(200).json(event);
    } catch (error) {
        logger.error(`Error fetching event with ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
};
