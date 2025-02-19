import pandas as pd
from string import Template

def excel_to_html(excel_file, template_file, output_file, group_column):
    """
    Konwertuje dane z pliku Excel do HTML używając przygotowanego szablonu,
    grupując dane według określonej kolumny.
    
    Args:
        excel_file (str): Ścieżka do pliku Excel
        template_file (str): Ścieżka do pliku z szablonem HTML
        output_file (str): Ścieżka do pliku wynikowego HTML
        group_column (str): Nazwa kolumny po której grupujemy dane
    """
    # Wczytaj dane z Excela
    try:
        df = pd.read_excel(excel_file)
    except Exception as e:
        print(f"Błąd podczas wczytywania pliku Excel: {e}")
        return

    # Sprawdź czy kolumna grupująca istnieje
    if group_column not in df.columns:
        print(f"Błąd: Kolumna '{group_column}' nie istnieje w pliku Excel")
        return

    # Wczytaj szablon HTML
    try:
        with open(template_file, 'r', encoding='utf-8') as f:
            template_html = Template(f.read())
    except Exception as e:
        print(f"Błąd podczas wczytywania szablonu: {e}")
        return

    # Przygotuj strukturę HTML
    final_html = ['<!DOCTYPE html>', '<html>', '<body>']
    
    # Grupuj dane
    grouped = df.groupby(group_column)
    
    # Iteruj przez każdą grupę
    for group_name, group_data in grouped:
        # Dodaj nagłówek grupy
        
        final_html.append('<li>')
        final_html.append(f'<h3 class="bold lg:pb-36 pb-6 pt-36">{group_name}</h3>')
        # Iteruj przez każdy wiersz w grupie
        for _, row in group_data.iterrows():
            try:
                # Konwertuj wiersz na słownik
                row_dict = row.to_dict()
                
                # Podstaw wartości do szablonu
                filled_template = template_html.safe_substitute(row_dict)
                final_html.append(filled_template)
            except KeyError as e:
                print(f"Błąd: Brak wymaganego pola w danych: {e}")
                continue
            except Exception as e:
                print(f"Błąd podczas przetwarzania wiersza: {e}")
                continue
        
        final_html.append('</li>')  # zamknij kontener grupy
    
    # Zamknij strukturę HTML
    final_html.extend(['</body>', '</html>'])

    # Zapisz wynik do pliku
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(final_html))
        print(f"Pomyślnie zapisano wynik do {output_file}")
    except Exception as e:
        print(f"Błąd podczas zapisywania pliku wynikowego: {e}")

# Przykład użycia:
if __name__ == "__main__":
    # Ścieżki do plików
    excel_file = "dane.xlsx"
    template_file = "szablon.html"
    output_file = "wynik.html"
    group_column = "Place"  # nazwa kolumny po której grupujemy
    
    excel_to_html(excel_file, template_file, output_file, group_column)