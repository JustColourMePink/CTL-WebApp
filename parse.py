import csv
import json

def parse_schedule():
    with open('2026 Conference Schedule.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # We need to see how the single events are structured
    out = []
    for row in rows:
        time = row['Time']
        if not time.strip():
            continue
        
        events = []
        for key, val in row.items():
            if key != 'Time' and val.strip():
                raw_title = val.strip()
                title = raw_title
                presenter = None
                
                # Extract presenter inside parenthesis at the end of the text
                import re
                match = re.search(r'\((.*?)\)([^\)]*)$', raw_title)
                if match:
                    # In case of malformed ending with empty parenthesis like `...Janik()`
                    presenter = match.group(1).strip()
                    title = raw_title[:match.start()].strip()
                    # if the presenter string was empty because it only caught empty paren
                    if not presenter:
                        # find the actual parenthesis
                        better_match = re.search(r'\((.*?)\)', raw_title)
                        if better_match:
                            presenter = better_match.group(1).strip()
                            title = raw_title[:better_match.start()].strip()

                # Handle specific line mentioned with a typo `Janik()`
                if 'Janik()' in raw_title:
                   title = raw_title.split(' (')[0].strip()
                   presenter = "Lynn Gilbertson/Cody Busch + Kim Apel/Pilar Joseph/Grace Peterson/Tarryl Janik"

                events.append({
                    'room': key,
                    'title': title,
                    'presenter': presenter
                })
        
        out.append({
            'time': time,
            'events': events,
            'isSingleEvent': len(events) == 1
        })

    with open('schedule.json', 'w') as f:
        json.dump(out, f, indent=4)

if __name__ == '__main__':
    parse_schedule()
